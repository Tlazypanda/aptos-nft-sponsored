import React, { useState, useEffect } from 'react';
import { useWallet, WalletName } from '@aptos-labs/wallet-adapter-react';
import { AptosClient, Types } from 'aptos';
import axios from 'axios';
import { Aptos, AptosConfig, Network, Transaction, BCS, Deserializer, AccountAuthenticator, SimpleTransaction } from "@aptos-labs/ts-sdk";

import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  FormControlLabel, 
  MenuItem,
  Select, 
  Switch, 
  TextField, 
  Typography 
} from '@mui/material';
import { styled } from '@mui/material/styles';

const MODULE_ADDRESS = "0x4358cfd369b2608af4a6f9fd4866d32aaa117e87cdbc9a21982780cd9dfb1e68";
const COLLECTION_ADDRESS = "0x2b4ea1c821e551f9e8da0165b6f344f67e9ada6a347ec17450bad1c8108e0b0f";

const aptosConfig = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(aptosConfig);

const KawaiiBackground = styled('div')({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'linear-gradient(45deg, #E6F3FF, #FFE6E6)',
  zIndex: -1,
});

const HoodedCat = styled('img')({
  position: 'absolute',
  top: '10%',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '200px',
  animation: 'float 3s ease-in-out infinite',
  '@keyframes float': {
    '0%, 100%': {
      transform: 'translateX(-50%) translateY(0px)',
    },
    '50%': {
      transform: 'translateX(-50%) translateY(-20px)',
    },
  },
});

const StyledCard = styled(Card)({
  maxWidth: 400,
  margin: 'auto',
  marginTop: '250px',
  background: 'rgba(255, 255, 255, 0.8)',
  borderRadius: '20px',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  backdropFilter: 'blur(4px)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  position: 'relative',
  overflow: 'visible',
});

const KawaiiTextField = styled(TextField)({
  '& label.Mui-focused': {
    color: '#6E8FAF',
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: '#B0C4DE',
      borderRadius: '15px',
    },
    '&:hover fieldset': {
      borderColor: '#6E8FAF',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#6E8FAF',
    },
  },
});

const KawaiiButton = styled(Button)({
  background: 'linear-gradient(45deg, #6E8FAF 30%, #B0C4DE 90%)',
  border: 0,
  borderRadius: 20,
  boxShadow: '0 3px 5px 2px rgba(176, 196, 222, .3)',
  color: 'white',
  height: 48,
  padding: '0 30px',
  '&:hover': {
    background: 'linear-gradient(45deg, #5D7A9A 30%, #9FB3CD 90%)',
    transform: 'scale(1.05)',
    transition: 'transform 0.3s ease-in-out',
  },
});

const KawaiiSwitch = styled(Switch)({
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: '#6E8FAF',
    '&:hover': {
      backgroundColor: 'rgba(110, 143, 175, 0.08)',
    },
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: '#6E8FAF',
  },
});

const NFTMintPage = () => {
  const { account, connected, connect, wallet, disconnect, signAndSubmitTransaction, signTransaction } = useWallet();
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState('');
  const [useSugarSponsor, setUseSugarSponsor] = useState(false);
  const [sugarSponsorType, setSugarSponsorType] = useState('daddy');
  const [sugarSponsorAddress, setSugarSponsorAddress] = useState('');

  useEffect(() => {
    console.log("Wallet connection status:", connected);
    console.log("Current account:", account);
  }, [connected, account]);

  const handleConnect = async () => {
        try {
            // Change below to the desired wallet name instead of "Petra"
            await connect("Petra"); 
            console.log('Connected to wallet:', account);
          } catch (error) {
            console.error('Failed to connect to wallet:', error);
          }
        
  };


  const buildMintTransaction = async () => {
    if (!account) throw new Error("Wallet not connected");
    
    return await aptos.transaction.build.simple({
      sender: account.address,
      withFeePayer: useSugarSponsor,
      data: {
        function: `${MODULE_ADDRESS}::launchpad::mint_nft`,
        functionArguments: [COLLECTION_ADDRESS, quantity],
      },
    });
  };

  const sendToSponsorServer = async (transactionBytes) => {
    try {
      const response = await axios.post('http://localhost:3002/sponsor-transaction', {
        transactionBytes: Array.from(transactionBytes),
      });
      return response.data;
    } catch (error) {
      console.error('Error sending transaction to sponsor server:', error);
      throw error;
    }
  };

  const handleMint = async () => {
    if (!connected || !account) {
        setStatus('Nya~ Please connect your wallet first, senpai! 💖');
        return;
      }

    try {
      let transactionHash;

      if (useSugarSponsor) {
        // Build the transaction
        const transaction = await buildMintTransaction();
        
        // User signs the transaction
        const userSignature = await signTransaction(transaction);
        
        // Here, you would typically send the transaction and userSignature to your backend
        // The backend would then forward it to the sugar sponsor for signing and submission
        setStatus(`Transaction signed! Waiting for ${sugarSponsorType} to spoil you... 💖`);


                // Send the serialized transaction to the sponsor server to sign
        const { sponsorAuthBytes, signedTransaction, sponsorAddress } = await sendToSponsorServer(transaction.bcsToBytes());

        const sponsorAuthBytesRe = new Uint8Array(sponsorAuthBytes);
        // deserialize fee payer authenticator
        let deserializer = new Deserializer(sponsorAuthBytesRe);
        const feePayerAuthenticator = AccountAuthenticator.deserialize(deserializer);
        console.log(feePayerAuthenticator)

        // Deserialize raw transaction
            const txnbytes = new Uint8Array(signedTransaction);
            deserializer = new Deserializer(txnbytes);
            console.log(deserializer)
            const signedTransactionRe = SimpleTransaction.deserialize(deserializer);

            console.log(transaction)
            console.log(signedTransactionRe)

        const response = await aptos.transaction.submit.simple({
            transaction: signedTransactionRe,
            senderAuthenticator: userSignature,
            feePayerAuthenticator,
        });

        const executedTransaction = await aptos.waitForTransaction({ transactionHash: response.hash });
        console.log("executed transaction", executedTransaction.hash);
        transactionHash = executedTransaction.hash
        setStatus(`Sugoi! Your ${sugarSponsorType} (${sponsorAddress}) has sponsored your transaction! 🎉✨`);
      
      } else {
        // Regular non-sponsored mint
        const response = await signAndSubmitTransaction({
            sender: account.address,
            data: {
          function: `${MODULE_ADDRESS}::launchpad::mint_nft`,
          functionArguments: [COLLECTION_ADDRESS, quantity],
            },
        });
        transactionHash = response.hash;
      }

      await aptos.waitForTransaction({ transactionHash });
      setStatus(`Sugoi! Successfully minted ${quantity} kawaii NFT(s)! 🎉✨ Transaction hash: ${transactionHash}`);
    } catch (error) {
      setStatus(`Gomen ne~ Error minting NFT: ${error} 😢 Don't give up, senpai!`);
    }
  };

  return (
    <>
      <KawaiiBackground />
      <HoodedCat src="/hoodie-cat.png" alt="Cute cat in hoodie" />
      <StyledCard>
        <CardHeader 
          title="Mint Your Kawaii Aptos NFT! 🐱✨" 
          titleTypographyProps={{ align: 'center', variant: 'h4', color: '#6E8FAF', fontFamily: 'Comic Sans MS, cursive' }}
        />
        <CardContent>
        {!connected ? (
            <KawaiiButton fullWidth onClick={handleConnect}>
              Connect Wallet
            </KawaiiButton>
          ) : (
            <>
            <Typography variant="body1" style={{ marginBottom: '1rem' }}>
                Connected: {account?.address.toString().slice(0, 6)}...{account?.address.toString().slice(-4)}
              </Typography>
              <KawaiiButton fullWidth onClick={disconnect}>
                Disconnect Wallet
              </KawaiiButton>
          <KawaiiTextField
            fullWidth
            label="How many kawaii NFTs do you want, senpai?"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
            inputProps={{ min: 1 }}
            margin="normal"
          />
          
          <FormControlLabel
            control={
              <KawaiiSwitch
                checked={useSugarSponsor}
                onChange={(e) => setUseSugarSponsor(e.target.checked)}
              />
            }
            label="Sugar Sponsor Mode 🍬"
          />
          
          {useSugarSponsor && (
              <Select
                fullWidth
                value={sugarSponsorType}
                onChange={(e) => setSugarSponsorType(e.target.value)}
                margin="normal"
                style={{ marginTop: '1rem', marginBottom: '1rem' }}
              >
                <MenuItem value="daddy">Sugar Daddy 👔</MenuItem>
                <MenuItem value="mommy">Sugar Mommy 👠</MenuItem>
              </Select>
              )}
              <KawaiiButton
                fullWidth
                variant="contained"
                onClick={handleMint}
                style={{ marginTop: 16 }}
              >
                {useSugarSponsor
                  ? `Let My Sugar ${sugarSponsorType} Spoil Me!`
                  : 'Mint My Kawaii NFT!'}
              </KawaiiButton>
            </>
          )}
          
          {status && (
            <Typography variant="body2" style={{ marginTop: 16, padding: 8, backgroundColor: 'rgba(176, 196, 222, 0.6)', borderRadius: 15, fontFamily: 'Comic Sans MS, cursive' }}>
              {status}
            </Typography>
          )}
        </CardContent>
      </StyledCard>
    </>
  );
};

export default NFTMintPage;