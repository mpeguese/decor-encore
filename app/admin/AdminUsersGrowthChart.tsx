// app/admin/AdminUsersGrowthChart.tsx
"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import styles from "./admin.module.css"

type UserGrowthPoint = {
  label: string
  users: number
}

type AdminUserGrowthChartProps = {
  totalUsers: number
  data: UserGrowthPoint[]
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0))
}

export default function AdminUserGrowthChart({
  totalUsers,
  data,
}: AdminUserGrowthChartProps) {
  return (
    <section className={styles.adminUserGrowthChart}>
      <div className={styles.adminUserGrowthHeader}>
        <div>
          <span>User growth</span>
          <h3>{formatNumber(totalUsers)} total users</h3>
          <p>Signup activity across recent growth windows.</p>
        </div>
      </div>

      <div className={styles.adminUserGrowthChartFrame}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: -18,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(81, 45, 56, 0.06)" }}
              formatter={(value) => [formatNumber(Number(value)), "Users"]}
              labelFormatter={(label) => `${label}`}
              contentStyle={{
                borderRadius: 16,
                border: "1px solid rgba(81, 45, 56, 0.12)",
                boxShadow: "0 18px 45px rgba(81, 45, 56, 0.12)",
              }}
            />
            <Bar
              dataKey="users"
              name="Users"
              radius={[12, 12, 6, 6]}
              fill="#87baab"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}