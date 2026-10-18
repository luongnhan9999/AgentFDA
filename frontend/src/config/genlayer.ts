import { studionet } from 'genlayer-js/chains';

// Canonical Deployed Contract on GenLayer StudioNet
export const DEFAULT_CONTRACT_ADDRESS = "0x5d5380b0622bFfC0492d3bC65516588Df1d1A9aD";

export const GENLAYER_STUDIONET = {
  ...studionet,
  id: 61999,
  name: "Genlayer Studio Network",
  rpcUrls: {
    default: { http: ["https://studio.genlayer.com/api"] },
    public: { http: ["https://studio.genlayer.com/api"] },
  },
  blockExplorers: {
    default: { name: "GenLayer Explorer", url: "https://genlayer-explorer.vercel.app" },
  },
  nativeCurrency: {
    name: "GEN Token",
    symbol: "GEN",
    decimals: 18,
  },
};

export const CHAIN_ID_HEX = "0x" + (61999).toString(16); // 0xF1EF
