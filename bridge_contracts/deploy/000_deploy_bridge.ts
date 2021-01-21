import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import { deployer,save_to_json,account_getter } from '../utils/utils';


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments} = hre;
  const{deploy}= deployments;
  const adeployer = await deployer();
  const contract_name = "Bridge";
  // console.log(adeployer);
  const signer1=account_getter("SIGNER1");
  const signer2=account_getter("SIGNER2");
  const signer3=account_getter("SIGNER3");
  // console.log(signer1,signer2,signer3);
  const deployResult=await deploy(contract_name,
    {
      from:adeployer,
      log:true,
      deterministicDeployment: false,
      args:[[signer1,signer2,signer3],1],
    });
  save_to_json(contract_name,{"address":deployResult.address,"tx":deployResult.transactionHash});

}

export default func;
func.tags =["heco_bridge"]
