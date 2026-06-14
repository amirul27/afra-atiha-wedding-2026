import { Link } from "react-router-dom";
import {
  ListChecks,
  Users,
  Wallet,
  ShoppingBag,
  Store,
  CalendarHeart,
  ArrowRight,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
} from "recharts";

import { useTasks } from "@/hooks/useTasks";
import { useGuests } from "@/hooks/useGuests";
import { useBudget } from "@/hooks/useBudget";
import { useShopping } from "@/hooks/useShopping";
import { useVendors } from "@/hooks/useVendors";
import { COUPLE, EVENTS, daysUntil } from "@/config/events";
import { formatBDT, sumBy } from "@/lib/utils";

import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const PLUM = "#6B2D5C";
const MARIGOLD = "#D99A2B";
const SAGE = "#5E7A6B";
const ROSE = "#E8C5D0";

export default function Dashboard() {
  const tasks = useTasks();
  const guests = useGuests();
  const budget = useBudget();
  const shopping = useShopping();
  const vendors = useVendors();

  const doneTasks = tasks.rows.filter((t) => t.status === "done").length;
  const taskPct = tasks.rows.length ? Math.round((doneTasks / tasks.rows.length) * 100) : 0;

  const confirmed = guests.rows.filter((g) => g.rsvp === "yes");
  const headcount = sumBy(confirmed, (g) => g.partySize);

  const estimated = sumBy(budget.rows, (b) => b.estimated);
  const spent = sumBy(budget.rows, (b) => b.paid);
  const budgetPct = estimated ? Math.min(100, Math.round((spent / estimated) * 100)) : 0;

  const toBuy = shopping.rows.filter((s) => s.status !== "received").length;
  const booked = vendors.rows.filter((v) => v.status === "booked" || v.status === "paid").length;

  const rsvpData = [
    { name: "Confirmed", value: guests.rows.filter((g) => g.rsvp === "yes").length, color: SAGE },
    { name: "Pending", value: guests.rows.filter((g) => g.rsvp === "pending").length, color: MARIGOLD },
    { name: "Maybe", value: guests.rows.filter((g) => g.rsvp === "maybe").length, color: ROSE },
    { name: "Declined", value: guests.rows.filter((g) => g.rsvp === "no").length, color: "#C4756B" },
  ].filter((d) => d.value > 0);

  const budgetByEvent = EVENTS.map((e) => ({
    name: e.name.split(" ")[0],
    estimate: sumBy(budget.rows.filter((b) => b.event === e.key), (b) => b.estimated),
    paid: sumBy(budget.rows.filter((b) => b.event === e.key), (b) => b.paid),
  }));

  return (
    <div className="space-y-7">
      {/* Hero countdown */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-plum-600 via-plum-700 to-plum-900 p-6 text-white sm:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-rose-100/70">{COUPLE.hashtag}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">
          {COUPLE.bride} &amp; {COUPLE.groom}
        </h1>
        <p className="mt-1 text-rose-100/80">Three celebrations, one beautiful year.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {EVENTS.map((e) => {
            const d = daysUntil(e.date);
            return (
              <div key={e.key} className="rounded-xl bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wide text-rose-100/70">{e.name}</p>
                <p className="mt-1 font-display text-2xl font-semibold">
                  {d > 0 ? `${d}` : d === 0 ? "Today" : "Done"}
                  {d > 0 && <span className="ml-1 text-sm font-normal text-rose-100/70">days</span>}
                </p>
                <p className="text-xs text-rose-100/70">
                  {new Date(e.date + "T00:00:00").toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stat tiles */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/tasks"><StatCard label="Tasks done" value={`${taskPct}%`} hint={`${doneTasks}/${tasks.rows.length} complete`} icon={ListChecks} accent="plum" /></Link>
        <Link to="/guests"><StatCard label="Confirmed guests" value={headcount} hint={`${confirmed.length} invites · ${guests.rows.length} total`} icon={Users} accent="sage" /></Link>
        <Link to="/budget"><StatCard label="Spent" value={formatBDT(spent)} hint={`of ${formatBDT(estimated)} planned`} icon={Wallet} accent="marigold" /></Link>
        <Link to="/shopping"><StatCard label="Still to buy" value={toBuy} hint={`${booked} vendors booked`} icon={ShoppingBag} accent="rose" /></Link>
      </section>

      {/* Progress + charts */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Overall progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <ProgressRow label="Tasks" value={taskPct} color="bg-plum-600" />
            <ProgressRow label="Budget used" value={budgetPct} color="bg-marigold" />
            <ProgressRow
              label="Vendors booked"
              value={vendors.rows.length ? Math.round((booked / vendors.rows.length) * 100) : 0}
              color="bg-sage"
            />
            <ProgressRow
              label="Shopping received"
              value={
                shopping.rows.length
                  ? Math.round(
                      (shopping.rows.filter((s) => s.status === "received").length /
                        shopping.rows.length) *
                        100,
                    )
                  : 0
              }
              color="bg-plum-400"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>RSVP status</CardTitle></CardHeader>
          <CardContent>
            {rsvpData.length === 0 ? (
              <EmptyChart label="Add guests to see RSVPs" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={rsvpData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={3}>
                    {rsvpData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
              {rsvpData.map((d) => (
                <span key={d.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                  {d.name} ({d.value})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Budget by event</CardTitle></CardHeader>
          <CardContent>
            {estimated === 0 ? (
              <EmptyChart label="Add budget items to compare" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={budgetByEvent}>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip formatter={(v: number) => formatBDT(v)} />
                  <Bar dataKey="estimate" fill={ROSE} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="paid" fill={PLUM} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Quick links */}
      <section className="grid gap-3 sm:grid-cols-3">
        <QuickLink to="/vendors" icon={Store} title="Vendors" desc={`${booked} of ${vendors.rows.length} booked`} />
        <QuickLink to="/calendar" icon={CalendarHeart} title="Calendar" desc="See every event & deadline" />
        <QuickLink to="/documents" icon={ShoppingBag} title="Documents" desc="Contracts, IDs, receipts" />
      </section>
    </div>
  );
}

function ProgressRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <Progress value={value} indicatorClassName={color} />
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">{label}</div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Button asChild variant="outline" className="h-auto justify-start p-4">
      <Link to={to}>
        <div className="flex w-full items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-plum-50 text-plum-600">
            <Icon className="h-5 w-5" />
          </span>
          <span className="flex-1 text-left">
            <span className="block font-medium text-foreground">{title}</span>
            <span className="block text-xs text-muted-foreground">{desc}</span>
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </Link>
    </Button>
  );
}
