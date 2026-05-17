// app/admin/AdminRevenueCharts.tsx
"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import styles from "./admin.module.css"

type MonthlyRevenuePoint = {
  month: string
  grossSales: number
  platformFees: number
  refunds: number
}

type OrderStatusPoint = {
  name: string
  value: number
}

type AdminRevenueChartsProps = {
  monthlyData: MonthlyRevenuePoint[]
  statusData: OrderStatusPoint[]
}

const statusColors = [
  "#667eea",
  "#764ba2",
  "#e879f9",
  "#87baab",
  "#b27092",
  "#512d38",
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function formatTooltipCurrency(value: number) {
  return `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export default function AdminRevenueCharts({
  monthlyData,
  statusData,
}: AdminRevenueChartsProps) {
  const hasMonthlyData = monthlyData.length > 0
  const hasStatusData = statusData.length > 0

  return (
    <section className={styles.adminChartGrid}>
      <article className={styles.adminChartCard}>
        <div className={styles.adminChartHeader}>
          <div>
            <span>Order health</span>
            <h3>Orders by status</h3>
          </div>
        </div>

        {hasStatusData ? (
          <div className={styles.adminDonutLayout}>
            <div className={styles.adminDonutChart}>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={64}
                    outerRadius={98}
                    paddingAngle={2}
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={statusColors[index % statusColors.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value, name) => [`${value} orders`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.adminChartLegend}>
              {statusData.map((entry, index) => (
                <div key={entry.name}>
                  <i
                    style={{
                      background: statusColors[index % statusColors.length],
                    }}
                    aria-hidden="true"
                  />
                  <span>{entry.name}</span>
                  <strong>{entry.value}</strong>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.adminChartEmpty}>
            No order status data available yet.
          </div>
        )}
      </article>

      <article className={styles.adminChartCard}>
        <div className={styles.adminChartHeader}>
          <div>
            <span>Revenue trend</span>
            <h3>Monthly revenue vs fees</h3>
          </div>

          <div className={styles.adminChartKey}>
            <span>Gross sales</span>
            <span>Platform fees</span>
            <span>Refunds</span>
          </div>
        </div>

        {hasMonthlyData ? (
          <div className={styles.adminBarChart}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData} barGap={6}>
                <CartesianGrid stroke="rgba(81, 45, 56, 0.1)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "rgba(81, 45, 56, 0.66)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(81, 45, 56, 0.12)" }}
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  tick={{ fill: "rgba(81, 45, 56, 0.66)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value, name) => {
                    const labels: Record<string, string> = {
                      grossSales: "Gross sales",
                      platformFees: "Platform fees",
                      refunds: "Refunds",
                    }

                    return [
                      formatTooltipCurrency(Number(value)),
                      labels[String(name)] || String(name),
                    ]
                  }}
                  labelFormatter={(label) => `Month: ${label}`}
                  contentStyle={{
                    borderRadius: "18px",
                    border: "1px solid rgba(81, 45, 56, 0.12)",
                    boxShadow: "0 16px 42px rgba(81, 45, 56, 0.14)",
                  }}
                />
                <Bar
                  dataKey="grossSales"
                  fill="#667eea"
                  radius={[10, 10, 0, 0]}
                />
                <Bar
                  dataKey="platformFees"
                  fill="#e879f9"
                  radius={[10, 10, 0, 0]}
                />
                <Bar
                  dataKey="refunds"
                  fill="#87baab"
                  radius={[10, 10, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className={styles.adminChartEmpty}>
            No eligible revenue data available yet.
          </div>
        )}
      </article>
    </section>
  )
}
