import {Line, LineChart, Tooltip, XAxis, YAxis} from "recharts";
import { CartesianGrid } from "recharts";
import type {TrainingPoint} from "../../data/trainingRuns.ts";

type MetricChartProps = {
    metric: "loss" | "lr" | "grad_norm",
    data: TrainingPoint[]
}

const MetricChart = ({metric, data}: MetricChartProps) => {
    const color = {
        loss: "#22D3EE",
        lr: "#A78BFA",
        grad_norm: "#34D399"
    }

    return (
        <>
            <h2 className="md:text-2xl text-xl font-bold text-gray-300 border-b-1 pb-4">
                {metric}
            </h2>

            <LineChart style={{width: '100%', aspectRatio: 1.618, maxWidth: 800, maxHeight: 400}}
                       responsive
                       data={data}
            >
                <XAxis dataKey="step" type="number"/>
                <YAxis width={30}/>
                <Tooltip/>

                <Line
                    type="linear"
                    stroke={color[metric]}
                    strokeWidth={2.5}
                    dataKey={metric}
                    dot={false}
                    connectNulls={false}
                    isAnimationActive={false}
                />

                <CartesianGrid
                    stroke="#334155"
                    strokeDasharray="3 3"
                    fill="#23282b"
                />
            </LineChart>
        </>
    )
}

export default MetricChart;