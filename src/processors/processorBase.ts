import * as ss58 from '@subsquid/ss58'
import { decodeHex, SubstrateBatchProcessor } from '@subsquid/substrate-processor'
import { TypeormDatabase } from '@subsquid/typeorm-store'
import assert from 'assert'
import { ChainName, chains } from '../config'
import { Chain, Transaction } from '../model'

export function runProcessor(name: ChainName) {
    const chainConfig = chains.find((ch) => ch.chainId === name)
    assert(chainConfig != null)

    const processor = new SubstrateBatchProcessor()
        .setBatchSize(100)
        .setDataSource({
            archive: chainConfig.url,
        })
        .setPrometheusPort(chainConfig.promPort)
        .setBlockRange({ from: 0 })
        .addCall('*', {
            data: {
                call: {
                    parent: {},
                },
                extrinsic: {
                    fee: true,
                    hash: true,
                    signature: true,
                    indexInBlock: true,
                    call: { origin: true },
                },
            } as const,
        } as const)

    processor.run(new TypeormDatabase({ stateSchema: name, isolationLevel: 'READ COMMITTED' }), async (ctx) => {
        let chain = await ctx.store.get(Chain, name)
        if (!chain) {
            chain = new Chain({
                id: chainConfig.chainId,
                latestBlock: -1,
                ss58Format: chainConfig.ss58Format,
            })

            await ctx.store.insert(chain)
        }

        const transactions: Transaction[] = []

        for (const block of ctx.blocks) {
            for (const item of block.items) {
                if (item.kind === 'call') {
                    if (item.call.parent != null || item.extrinsic.signature?.address == null) continue

                    const { hash, call, signature, indexInBlock, id, fee } = item.extrinsic

                    const [section, method] = call.name.split('.')

                    const address =
                        signature.address.__kind == 'Id' || signature.address.__kind == 'AccountId'
                            ? signature.address.value
                            : (signature.address as string)

                    transactions.push(
                        new Transaction({
                            id: id,
                            chain,
                            extrinsicHash: hash,
                            blockNumber: block.header.height,
                            timestamp: new Date(block.header.timestamp),
                            indexInBlock: indexInBlock,
                            section,
                            method,
                            name: call.name,
                            signer: ss58.codec(chainConfig.ss58Format).encode(decodeHex(address)),
                            fee: fee,
                        })
                    )
                }
            }
            chain.latestBlock = block.header.height
        }

        await ctx.store.insert(transactions)
        await ctx.store.save(chain)
    })
}
