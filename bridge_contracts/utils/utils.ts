import 'dotenv/config';
const envfile = require('envfile');
const fs = require('fs')

export function deployer(): string {
    const priv = process.env["DEPLOYER_PRIVATE"];
    return priv
}

export function node_url(): string {
   const uri = process.env["NETWORK_RPC"];
    if (uri && uri !== '') {
      return uri;
    }
    console.log(uri);
}


export function save_to_json(key :string ,value:object){
    var path = "deploy_res.json"
    let obj = {};

    if (fs.existsSync(path)) {
        obj = JSON.parse( fs.readFileSync(path, 'utf-8'));
        obj[key]=value;
        let json = JSON.stringify(obj);
        fs.writeFileSync(path, json);
    }else {
        obj[key]=value;
        let json = JSON.stringify(obj);
        fs.writeFileSync(path, json);
    }
}


export function account_getter(a:string ): string {
  const priv = process.env[a];
  return priv
}

export function save_to_env(key:string, value: string){
    console.log("start to save");
    const path = '.env';
    let obj = envfile.parse(fs.readFileSync(path,"utf-8"));
    obj[key] = "\"" +value+ "\"";

    let env = envfile.stringify(obj);
    fs.writeFileSync(path,env);
    console.log(key+" saved to env file");
    }

export function contract_getter(contractName:string):string{
        var path = "deploy_res.json"
        var data = JSON.parse( fs.readFileSync(path, 'utf-8'));
        return data[contractName]["address"]
};