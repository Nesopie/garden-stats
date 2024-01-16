import express from "express";
import { fee, summary, volume } from "./connector";

const app = express();
const port = 3001;

const router = express.Router();

router.get("/volume", (req, res) => {
    volume(req, res);
});

router.get("/fee", (req, res) => {
    fee(req, res);
});

router.get("/summary", (req, res) => {
    summary(req, res);
});

app.use(router);

app.listen(port, "0.0.0.0", () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});
