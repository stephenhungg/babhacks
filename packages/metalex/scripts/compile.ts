/**
 * Compile SAFEAgreement.sol using solc and output ABI + bytecode to src/abi/
 * Run: npm run compile:sol
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const contractPath = resolve(__dirname, "../contracts/SAFEAgreement.sol");
const outputPath = resolve(__dirname, "../src/abi/SAFEAgreement.json");

const source = readFileSync(contractPath, "utf8");

const input = {
  language: "Solidity",
  sources: {
    "SAFEAgreement.sol": { content: source },
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"],
      },
    },
  },
};

console.log("Compiling SAFEAgreement.sol...");
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  const errors = output.errors.filter(
    (e: { severity: string }) => e.severity === "error"
  );
  if (errors.length > 0) {
    console.error("Compilation errors:");
    for (const err of errors) {
      console.error(err.formattedMessage);
    }
    process.exit(1);
  }
  // print warnings
  for (const warn of output.errors) {
    if (warn.severity === "warning") {
      console.warn(`Warning: ${warn.message}`);
    }
  }
}

const contract = output.contracts["SAFEAgreement.sol"]["SAFEAgreement"];
const artifact = {
  abi: contract.abi,
  bytecode: `0x${contract.evm.bytecode.object}`,
};

writeFileSync(outputPath, JSON.stringify(artifact, null, 2));
console.log(`Artifact written to ${outputPath}`);
console.log(`  ABI: ${artifact.abi.length} entries`);
console.log(`  Bytecode: ${artifact.bytecode.length} chars`);
