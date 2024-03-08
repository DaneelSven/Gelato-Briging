import Head from "next/head";
import Image from "next/image";
import styles from "@/styles/Home.module.css";
import { useCallback, useEffect, useState } from "react";
import {
  useAccount,
  useContractWrite,
  useNetwork,
  useSwitchNetwork,
} from "wagmi";
import { erc20Abi2771 } from "../../abis/erc20TokenAbi2771";
import Link from "next/link";
import React from "react";
import MintModal from "./MintModal";
import BurnModal from "./BurnModal";
import { ethers } from "ethers";
import { GelatoRelay, CallWithERC2771Request } from "@gelatonetwork/relay-sdk";

export default function Home() {
  const [isNetworkSwitchHighlighted, setIsNetworkSwitchHighlighted] = useState(false);
  const [isConnectHighlighted, setIsConnectHighlighted] = useState(false);
  const [showSwap, setshowSwap] = useState(false);
  const { address } = useAccount();
  const { chain } = useNetwork(); // This gives the current network chain information
  const [hasNetworkBalance, setNetworkBalance] = useState(false);
  const { switchNetwork } = useSwitchNetwork();
  const [arbitrumBalance, setArbitrumBalance] = useState("");
  const [optimismBalance, setOptimismBalance] = useState("");
  const [showMintModal, setShowMintModal] = useState(false);
  const [showBurnModal, setShowBurnModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [recentAction, setRecentAction] = useState("");
  const [mintTransactionId, setMintTransactionId] = useState("");
  const [burnTransactionId, setBurnTransactionId] = useState("");
  const [bannerText, setBannerText] = useState("Your dynamic banner text here");

  const erc20AddressArbitrum = process.env
    .NEXT_PUBLIC_ERC20_ADDRESS_ARBITRUM as `0x${string}`;
  const erc20AddressOptimism = process.env
    .NEXT_PUBLIC_ERC20_ADDRESS_OPTIMISM as `0x${string}`;

  const erc20ContractAbitrumUrl = `https://sepolia.arbiscan.io/address/${erc20AddressArbitrum}#transaction`;
  const erc20ContractOptimismUrl = `https://sepolia-optimism.etherscan.io/address/${erc20AddressOptimism}#transaction`;

  const [connectedSmartContractAddress, setConnectedSmartContractAddress] =
    useState(erc20AddressArbitrum);

  const arbitrumChainId = Number(process.env.NEXT_PUBLIC_ARBITRUM_CHAIN_ID);
  const optimismChainId = Number(process.env.NEXT_PUBLIC_OPTIMISM_CHAIN_ID);

  // RPC URLs for Arbitrum and Optimism networks
  const arbitrumRpcUrl = process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL;
  const optimismRpcUrl = process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL;

  // Setup providers
  const arbitrumProvider = new ethers.JsonRpcProvider(arbitrumRpcUrl);
  const optimismProvider = new ethers.JsonRpcProvider(optimismRpcUrl);
  // Initialize contract instances for each network
  const contractArbitrum = new ethers.Contract(
    erc20AddressArbitrum,
    erc20Abi2771,
    arbitrumProvider
  );

  const contractOptimism = new ethers.Contract(
    erc20AddressOptimism,
    erc20Abi2771,
    optimismProvider
  );

  function getEtherscanUrl(chainId: number, txHash: any) {
    if (chainId === undefined) {
      return ""; // or set a default value
    }

    const baseUrl: any = {
      421614: "https://sepolia.arbiscan.io/tx/",
      11155420: "https://sepolia-optimism.etherscan.io/tx/",
    };

    return baseUrl[chainId as number]
      ? `${baseUrl[chainId as number]}${txHash}`
      : "";
  }

  // add both contract addresses here 2771 and normal
  useEffect(() => {
    const promptSwitchNetwork = async () => {
      if (chain?.id === arbitrumChainId) {
        try {
          setConnectedSmartContractAddress(erc20AddressArbitrum);
        } catch (switchError) {
          console.error("Error switching network in MetaMask:", switchError);
        }
      }
      if (chain?.id === optimismChainId) {
        try {
          setConnectedSmartContractAddress(erc20AddressOptimism);
        } catch (switchError) {
          console.error("Error switching network in MetaMask:", switchError);
        }
      }
    };

    promptSwitchNetwork();
  }, [chain, switchNetwork]);

  const closeAll = () => {
    setIsNetworkSwitchHighlighted(false);
    setIsConnectHighlighted(false);
  };



  const { write: writeMint } = useContractWrite({
    address: connectedSmartContractAddress,
    abi: erc20Abi2771,
    functionName: "mint",
  });

  const getAllBalance = useCallback(async () => {
    const balanceArbitrum = await contractArbitrum.balanceOf(address);
    const balanceOptimism = await contractOptimism.balanceOf(address);
    console.log("balance op", balanceOptimism)
    // Convert balances to a readable format, defaulting to "0" if undefined or null
    setArbitrumBalance(balanceArbitrum ? ethers.formatEther(balanceArbitrum) : "0");
    setOptimismBalance(balanceOptimism ? ethers.formatEther(balanceOptimism) : "0");

  }, []);

  const handleMint = async (amount: string) => {
    try {
      // Call the contract function and wait for the result
      writeMint({
        args: [address, amount],
      });
    } catch (error) { }
  };

  const handleBurn = async (amount: string) => {
    try {

      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const user = await signer.getAddress();
      const contract = new ethers.Contract(
        connectedSmartContractAddress,
        erc20Abi2771,
        signer
      );

      const formattedAmount = ethers.parseUnits(amount, 18)

      const { data } = await contract.burn.populateTransaction(formattedAmount);
      const chainId = (await provider.getNetwork()).chainId;

      // Populate a relay request
      const request: CallWithERC2771Request = {
        chainId: chainId,
        target: connectedSmartContractAddress,
        data: data,
        user: user,
      };

      const relay = new GelatoRelay();
      const relayResponse = await relay.sponsoredCallERC2771(
        request,
        // @ts-ignore
        provider,
        "eGWFYP7yw_zJ8Y1beN1wJuDvuYWbsYONLjEWsqDLfQE_"
      );
      console.log("relayseponse", relayResponse.taskId);

      getAllBalance();
    } catch (error) { }
  };

  const getCurrentTransactionId = () => {
    switch (recentAction) {
      case "mint":
        return mintTransactionId;
      case "burn":
        return burnTransactionId;
      default:
        return "";
    }
  };

  useEffect(() => {
    // Ensure there's a connected address before fetching balances
    if (address) {
      getAllBalance();
    }
  }, [getAllBalance, address]); // This will call getAllBalance when the component mounts and anytime 'address' changes.



  // Use this function to get the current transaction ID for display
  const currentTransactionId = getCurrentTransactionId();

  return (
    <>
      <Head>
        <title>WalletConnect | Next Starter Template</title>
        <meta name="description" content="Generated by create-wc-dapp" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        className={styles.backdrop}
        style={{
          opacity: isConnectHighlighted || isNetworkSwitchHighlighted ? 1 : 0,
        }}
      />
      <header className={styles.header}>
        <div className={`${styles.logo} ${styles.DBLogo}`}>
          <Image
            src="/swapping.png"
            alt="WalletConnect Logo"
            height="150"
            width="150"
          />
        </div>
        <Link className={styles.linkStyle} href={erc20ContractOptimismUrl}>
          <button className={styles.glowOnHover}>Optimism Contract</button>
        </Link>

        <Link className={styles.linkStyle} href={erc20ContractAbitrumUrl}>
          <button className={styles.glowOnHover}>Arbitrum Contract</button>
        </Link>

        <div className={styles.buttons}>
          <div
            onClick={closeAll}
            className={`${styles.highlight} ${isNetworkSwitchHighlighted ? styles.highlightSelected : ``
              }`}
          >
            <w3m-network-button />
          </div>
          <div
            onClick={closeAll}
            className={`${styles.highlight} ${isConnectHighlighted ? styles.highlightSelected : ``
              }`}
          >
            <w3m-button />
          </div>
        </div>
      </header>
      <main className={styles.main}>
        <div>
          <div className={styles.explenation}>
            This project demonstrates the process of bridging an ERC20 token
            between two testnets by leveraging the Gelato Web3 Function,
            Gelato Relay, and MockERC20 system. By integrating Gelato's tools,
            the project showcases a practical implementation of cross-chain
            operations within the Ethereum ecosystem, highlighting the
            potential for enhanced interoperability and user engagement in
            decentralized platforms.
          </div>

          <div className={styles.explenationSteps}>
            To showcase bidirectional bridging between Arbitrum and Optimism,
            tokens burned on one network will automatically be mirrored on the
            opposite network, allowing the same amount of tokens to be
            received without incurring any costs for the minting transaction.
          </div>

          <div className={styles.balance}>
            <div>Arbitrum Balance: {arbitrumBalance}</div>
            <div>Optimism Balance: {optimismBalance}</div>

            {showBanner && (
              <div
                className={`${styles.banner} ${!showBanner ? "hide" : ""}`}
              >
                {/* Show spinner when transaction is in progress */}
                {currentTransactionId ? (
                  <a
                    href={getEtherscanUrl(chain!.id, currentTransactionId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.bannerText}
                  >
                    {bannerText}
                  </a>
                ) : (
                  <span className={`${styles.bannerText}`}>{bannerText}</span>
                )}
              </div>
            )}
          </div>

          <div className={styles.explenationSteps}>
            You need some Tokens to test Gasless Burn
          </div>
          <div className={styles.swapGrid}>
            <div>
              <a
                href="#"
                className={styles.animatedButton5}
                onClick={() => setShowMintModal(true)}
              >
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                Admin Mint
              </a>
            </div>
            <div>
              <a
                href="#"
                className={styles.animatedButton1}
                onClick={() => setShowBurnModal(true)}
              >
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                Gassless Burn
              </a>
            </div>
            <MintModal
              isOpen={showMintModal}
              onClose={() => setShowMintModal(false)}
              onTrade={handleMint}
            />
            <BurnModal
              isOpen={showBurnModal}
              onClose={() => setShowBurnModal(false)}
              onTrade={handleBurn}
            />
          </div>
        </div>
      </main>
    </>
  );
}
