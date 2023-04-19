import {libNode} from '@eversdk/lib-node'
import {
    ResultOfEncodeMessage,
    ResultOfRunTvm,
    TonClient
} from '@eversdk/core'
import {TokenRoot} from './abi/TokenRoot'
import {TokenWallet} from './abi/TokenWallet'

const ADDRESS: string = '0:a519f99bb5d6d51ef958ed24d337ad75a1c770885dcd42d51d6663f9fcdacfb2'
const OWNER: string = '0:3131a2e5b96f71534311d5ae6670c408f70a317dc05265e7e3c455b3d335ba6c'
const ENDPOINT: string = 'https://mainnet.evercloud.dev/891375428d7749a798093eac2b3db2bf'

async function main(): Promise<void> {
    /////////////////
    // Init client //
    /////////////////
    TonClient.useBinaryLibrary(libNode)
    const client: TonClient = new TonClient({
        network: {
            endpoints: [ENDPOINT]
        }
    })


    //////////////////////
    // Read bag of cell //
    //////////////////////
    const rootBagOfCell: string = (await client.net.query({query: `
        query {
          blockchain {
            account(
              address: "${ADDRESS}"
            ) {
               info {
                boc
              }
            }
          }
        }`})).result.data.blockchain.account.info.boc


    ////////////////////////////////////////
    // Encode message and run TVM locally //
    ////////////////////////////////////////
    const walletOfEncodedMessage: ResultOfEncodeMessage = await client.abi.encode_message({
        abi: {
            type: 'Contract',
            value: TokenRoot
        },
        signer: {
            type: 'None'
        },
        call_set: {
            function_name: 'walletOf',
            input: {
                answerId: 0,
                walletOwner: OWNER
            }
        },
        address: ADDRESS
    })
    const walletOfMessage: ResultOfRunTvm = await client.tvm.run_tvm({
        message: walletOfEncodedMessage.message,
        account: rootBagOfCell
    })


    ///////////////////
    // Decode result //
    ///////////////////
    const walletOfMessageOutMessages: string = walletOfMessage.out_messages[0]
    const wallet: string = (await client.abi.decode_message({
        abi: {
            type: 'Contract',
            value: TokenRoot
        },
        message: walletOfMessageOutMessages
    })).value.value0



    //////////////////////
    // Read bag of cell //
    //////////////////////
    const walletBagOfCell: string = (await client.net.query({query: `
        query {
          blockchain {
            account(
              address: "${wallet}"
            ) {
               info {
                boc
              }
            }
          }
        }`})).result.data.blockchain.account.info.boc


    ////////////////////////////////////////
    // Encode message and run TVM locally //
    ////////////////////////////////////////
    const getWalletEncodedMessage: ResultOfEncodeMessage = await client.abi.encode_message({
        abi: {
            type: 'Contract',
            value: TokenWallet
        },
        signer: {
            type: 'None'
        },
        call_set: {
            function_name: 'balance',
            input: {
                answerId: 0
            }
        },
        address: ADDRESS
    })
    const getWalletOutMessage: string = (await client.tvm.run_tvm({
        message: getWalletEncodedMessage.message,
        account: walletBagOfCell
    })).out_messages[0]


    ///////////////////
    // Decode result //
    ///////////////////
    const walletBalance: string = (await client.abi.decode_message({
        abi: {
            type: 'Contract',
            value: TokenWallet
        },
        message: getWalletOutMessage
    })).value.value0
    console.log(walletBalance)


    //////////////////
    // Close client //
    //////////////////
    client.close()
}

main().catch(console.error)