import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { deployer,save_to_json,save_to_env } from '../utils/utils';

const fs = require("fs");

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments} = hre;
  const{deploy}= deployments;
  const adeployer = await deployer();
  const contract_name = "HUSD";
  console.log(adeployer);
  const deployResult=await deploy(contract_name,
    {
      from:adeployer,
      log:true,
      deterministicDeployment: false,
      args:["husd","husd","6"]
    });
  save_to_json(contract_name,{"address":deployResult.address,"tx":deployResult.transactionHash});
  console.log("===save to .env===");
  save_to_env("HUSD",deployResult.address);

}

export default func;
func.tags =["husd"]


