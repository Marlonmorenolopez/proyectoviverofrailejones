async function main() {
    const ViveroBogota = await ethers.getContractFactory("ViveroBogota");
    const viveroBogota = await ViveroBogota.deploy();
    await viveroBogota.deployed();
    console.log("Contrato desplegado en:", viveroBogota.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  