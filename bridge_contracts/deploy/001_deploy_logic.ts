// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.

import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { deployer,save_to_json,account_getter } from '../utils/utils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments} = hre;
  const{deploy}= deployments;
  const adeployer = await deployer();
  const heco_bridge = await deployments.get('Bridge');

  const deployResult=await deploy("BridgeLogic",
      {
        from:adeployer,
        log:true,
        deterministicDeployment: false,
        args:[heco_bridge.address]
      }
    );
    save_to_json("BridgeLogic",{"address":deployResult.address,"tx":deployResult.transactionHash});

}

export default func;
func.tags =["heco_bridge"]
func.dependencies = ["Bridge"];

