import express from "express";
import { pg } from "../db/connector";
import { supportedChains } from "../constants";

export const volume = async (req: express.Request, res: express.Response) => {
    let { chain, interval, end } = req.query;
    if (!chain) chain = "bitcoin";

    if (!supportedChains.includes(chain.toString())) {
        res.status(400).json({
            error: "Unsupported chain",
        });
        return;
    }
    let intervalInSeconds = "0";

    switch (interval) {
        case "day":
            intervalInSeconds = "24*60*60";
            break;
        case "hour":
            intervalInSeconds = "24*60";
            break;
        case "minute":
            intervalInSeconds = "60";
            break;
        case "second":
            intervalInSeconds = "1";
            break;
        default:
            intervalInSeconds = "0";
    }

    console.log(chain, interval, end);
    const result = await pg
        .select(
            pg.raw(
                `SUM(
                    case 
		                when init.chain = '${chain}' then (init.amount::float / 100000000) * (init.price_by_oracle) 
		                when foll.chain = '${chain}' then (foll.amount::float / 100000000) * (foll.price_by_oracle) 
	                end
                )`
            )
        )
        .from("orders as o")
        .innerJoin(
            "atomic_swaps AS init",
            "o.initiator_atomic_swap_id",
            "init.id"
        )
        .innerJoin(
            "atomic_swaps AS foll",
            "o.follower_atomic_swap_id",
            "foll.id"
        )
        .where("o.status", 3)
        .andWhere(
            pg.raw(
                intervalInSeconds === "0"
                    ? "1 = 1"
                    : `extract(epoch from o.updated_at) >= ${
                          //starting point of the interval
                          end ?? "extract(epoch from now())"
                      } - ${intervalInSeconds}`
            )
        )
        .andWhere(
            pg.raw(
                `extract(epoch from o.updated_at) < ${
                    //ending point of the interval
                    end ?? "extract(epoch from now())"
                }`
            )
        );

    res.status(200).json({
        data: {
            volume: result[0][Object.keys(result[0])[0]] ?? 0,
        },
    });
};
