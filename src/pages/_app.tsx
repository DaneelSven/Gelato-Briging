import "@/styles/globals.css";
import { createWeb3Modal, defaultWagmiConfig } from "@web3modal/wagmi/react";
import { WagmiConfig } from "wagmi";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import {
	arbitrumSepolia,
	optimismSepolia,
} from "wagmi/chains";
import React from "react";

const chains = [
	optimismSepolia,
	arbitrumSepolia
];

// 1. Get projectID at https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "";

const metadata = {
	name: "Next Swapping",
	description: "A Next.js app with Web3Modal v3 + Wagmi",
};

const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });
createWeb3Modal({  wagmiConfig, projectId, chains });


export  default function App({ Component, pageProps }: AppProps) {
	const [ready, setReady] = useState(false);

	useEffect(() => {
		setReady(true);
	}, []);
	return (
		<>
			{ready ? (
				<WagmiConfig config={wagmiConfig}>
					<Component {...pageProps} />
				</WagmiConfig>
			) : null}
		</>
	);
}
