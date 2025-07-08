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

const menomic = Deno.env.get("MNEMONIC");
const blockfrostId = Deno.env.get("BLOCKFROST_ID");
const blockfrostNetwork = Deno.env.get("BLOCKFROST_NETWORK");

const lucid = new Lucid({
  provider: new Blockfrost(blockfrostNetwork, blockfrostId),
});

lucid.selectWalletFromSeed(menomic);
const address = await lucid.wallet.address();
console.log("Address: " + address);

const paymentHashOwner = Addresses.inspect(address).payment?.hash;
if (!paymentHashOwner) {
  throw new Error("Failed to extract payment hash from address");
}

const paymentHashBeneficiary = Addresses.inspect(address).payment?.hash;
if (!paymentHashBeneficiary) {
  throw new Error("Failed to extract payment hash from address");
}

// Set timeline for the lock
const currentTime = new Date();
const offset = 2 * 60 * 1000; // 2 phút
const deadlinePOSIX = BigInt(currentTime.getTime() + offset);

console.log("Deadline POSIX: " + deadlinePOSIX.toString());

const datumInline = Data.to(
  new Constr(0, [deadlinePOSIX, paymentHashOwner, paymentHashBeneficiary])
);

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

const tx = await lucid
  .newTx()
  .payToContract(
    contractAddress,
    { Inline: datumInline },
    { lovelace: 2900000n }
  )
  .commit();
const signedTx = await tx.sign().commit();
const txHash = await signedTx.submit();
console.log(
  `2900000 Lovelace locked into the contract at:    Tx ID: ${txHash} `
);

// Thay Hieu
//   const tx = await lucid
//     .newTx()
//     .payToContract(signerbyAddress, { Inline: datum }, { lovelace })
//     .validTo(Date.now() + 100000)
//     .commit();
