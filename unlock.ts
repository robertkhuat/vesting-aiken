// import các thư viện cần thiết
import {
  Blockfrost,
  Lucid,
  Addresses,
  fromHex,
  toHex,
  fromText,
  Data,
  Constr,
} from "https://deno.land/x/lucid@0.20.9/mod.ts";
import "jsr:@std/dotenv/load";
import * as cbor from "https://deno.land/x/cbor@v1.4.1/index.js";

const menomic = Deno.env.get("MNEMONIC");
const blockfrostId = Deno.env.get("BLOCKFROST_ID");
const blockfrostNetwork = Deno.env.get("BLOCKFROST_NETWORK");
const lucid = new Lucid({
  provider: new Blockfrost(blockfrostNetwork, blockfrostId),
});
lucid.selectWalletFromSeed(menomic);
const address = await lucid.wallet.address();
console.log("Address: " + address);

const validator = await readValidator();
const contractAddress = lucid.newScript(validator).toAddress();
console.log("Contract Address: " + contractAddress);

async function readValidator(): Promise<SpendingValidator> {
  const validator = JSON.parse(await Deno.readTextFile("plutus.json"))
    .validators[0];
  return {
    type: "PlutusV3",
    script: validator.compiledCode, // giữ nguyên chuỗi hex CBOR
  };
}
