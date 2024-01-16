import express from "express";
import { pg } from "../db/connector";

export const summary = async (req: express.Request, res: express.Response) => {
    const { start, end } = req.query;

    const result = await pg
        .select(
            pg.raw(`
    DATE(o.created_at at time zone 'UTC') as order_date,
    SUM(
      CASE WHEN o.order_pair LIKE 'bitcoin%'
      AND o.initiator_atomic_swap_id = ass.id THEN CAST(ass.amount AS DECIMAL) ELSE 0 END
    ) AS sum_initiator_bitcoin,
    SUM(
      CASE WHEN o.order_pair LIKE 'ethereum:%'
      AND o.initiator_atomic_swap_id = ass.id THEN CAST(ass.amount AS DECIMAL) ELSE 0 END
    ) AS sum_initiator_ethereum,
    SUM(
      CASE WHEN o.order_pair LIKE 'ethereum_arbitrum:%'
      AND o.initiator_atomic_swap_id = ass.id THEN CAST(ass.amount AS DECIMAL) ELSE 0 END
    ) AS sum_initiator_arbitrum,
    SUM(
      CASE WHEN o.order_pair LIKE '%-bitcoin%'
      AND o.follower_atomic_swap_id = ass.id THEN CAST(ass.amount AS DECIMAL) ELSE 0 END
    ) AS sum_follower_bitcoin,
    SUM(
      CASE WHEN o.order_pair LIKE '%-ethereum:%'
      AND o.follower_atomic_swap_id = ass.id THEN CAST(ass.amount AS DECIMAL) ELSE 0 END
    ) AS sum_follower_ethereum,
    SUM(
      CASE WHEN o.order_pair LIKE '%-ethereum_arbitrum:%'
      AND o.follower_atomic_swap_id = ass.id THEN CAST(ass.amount AS DECIMAL) ELSE 0 END
    ) AS sum_follower_arbitrum,
    SUM(
      CASE WHEN (
        o.order_pair LIKE 'bitcoin%'
        AND o.initiator_atomic_swap_id = ass.id
      )
      OR (
        o.order_pair LIKE '%-bitcoin%'
        AND o.follower_atomic_swap_id = ass.id
      ) THEN (
        CAST(ass.amount AS DECIMAL) / 100000000
      ) * ass.price_by_oracle ELSE 0 END
    ) AS sum_fiat_bitcoin,
    SUM(
      CASE WHEN (
        o.order_pair LIKE 'ethereum:%'
        AND o.initiator_atomic_swap_id = ass.id
      )
      OR (
        o.order_pair LIKE '%-ethereum:%'
        AND o.follower_atomic_swap_id = ass.id
      ) THEN (
        CAST(ass.amount AS DECIMAL) / 100000000
      ) * ass.price_by_oracle ELSE 0 END
    ) AS sum_fiat_ethereum,
    SUM(
      CASE WHEN (
        o.order_pair LIKE 'ethereum_arbitrum:%'
        AND o.initiator_atomic_swap_id = ass.id
      )
      OR (
        o.order_pair LIKE '%-ethereum_arbitrum:%'
        AND o.follower_atomic_swap_id = ass.id
      ) THEN (
        CAST(ass.amount AS DECIMAL) / 100000000
      ) * ass.price_by_oracle ELSE 0 END
    ) AS sum_fiat_arbitrum,
    SUM(
      CASE WHEN (
        o.initiator_atomic_swap_id = ass.id
        OR o.follower_atomic_swap_id = ass.id
      ) THEN (
        CAST(ass.amount AS DECIMAL) / 100000000
      ) * ass.price_by_oracle ELSE 0 END
    ) AS sum_fiat_value`)
        )
        .from(`atomic_swaps as ass`)
        .join(
            pg.raw(`orders o ON o.initiator_atomic_swap_id = ass.id
                    OR o.follower_atomic_swap_id = ass.id`)
        )
        .where("o.status", "3")
        .andWhere(pg.raw("o.order_pair NOT LIKE '%testnet%'"))
        .andWhere(
            pg.raw(
                start
                    ? `DATE(o.created_at at time zone 'UTC') >= DATE('${start}')`
                    : "1=1"
            )
        )
        .andWhere(
            pg.raw(
                end
                    ? `DATE(o.created_at at time zone 'UTC') <= DATE('${end}')`
                    : "1=1"
            )
        )
        .groupBy(pg.raw("DATE(o.created_at at time zone 'UTC')"))
        .orderBy("order_date", "desc");

    res.status(200).json(result);
};
