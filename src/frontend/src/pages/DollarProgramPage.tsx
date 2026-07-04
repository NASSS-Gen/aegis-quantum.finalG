import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store/appStore";
import {
  Check,
  CircleDollarSign,
  Clock,
  Lock,
  type LucideIcon,
  Sparkles,
  Trophy,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * $1 Program section — standalone page at /dollar-program.
 *
 * Explains the $1 funded trading opportunity: what it is, eligibility,
 * participation steps, and the user's enrollment status. All surfaces use
 * the monochrome Apple-inspired design tokens — pure greyscale OKLCH, system
 * fonts, rounded corners, subtle shadows.
 */

type EnrollmentState = "not_enrolled" | "in_progress" | "completed";

interface ProgramStep {
  index: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

interface EligibilityItem {
  label: string;
  detail: string;
}

interface ProgramBenefit {
  title: string;
  description: string;
  icon: LucideIcon;
}

const PROGRAM_STEPS: ProgramStep[] = [
  {
    index: 1,
    title: "Enroll with $1",
    description:
      "Fund your program account with a single dollar. This locks your seat and activates your evaluation track.",
    icon: Wallet,
  },
  {
    index: 2,
    title: "Trade the evaluation",
    description:
      "Execute paper trades through the Practice Arena against live prices. Hit the profit target without breaching the drawdown limit.",
    icon: Sparkles,
  },
  {
    index: 3,
    title: "Get funded",
    description:
      "Pass the evaluation and unlock a funded trading account. Trade firm capital and keep a share of the profits you generate.",
    icon: Trophy,
  },
];

const ELIGIBILITY: EligibilityItem[] = [
  {
    label: "Verified Internet Identity",
    detail: "An active Internet Identity principal is required to enroll.",
  },
  {
    label: "Completed onboarding",
    detail:
      "Finish the Aegis Quantum onboarding flow before joining the program.",
  },
  {
    label: "Single enrollment per principal",
    detail: "Each identity may hold one active program seat at a time.",
  },
  {
    label: "Practice-only execution",
    detail:
      "Evaluation trades run on paper — no real capital is at risk during the trial.",
  },
];

const BENEFITS: ProgramBenefit[] = [
  {
    title: "Low barrier",
    description:
      "A single dollar unlocks the full evaluation track — no minimum balance, no deposit tiers.",
    icon: CircleDollarSign,
  },
  {
    title: "Disciplined risk",
    description:
      "A fixed drawdown limit enforces the same risk controls used across every Aegis module.",
    icon: Lock,
  },
  {
    title: "Funded on merit",
    description:
      "Pass the evaluation and trade firm capital. Profit share scales with your track record.",
    icon: Trophy,
  },
];

const STATUS_META: Record<
  EnrollmentState,
  { label: string; tone: "default" | "secondary" | "outline" }
> = {
  not_enrolled: { label: "Not enrolled", tone: "outline" },
  in_progress: { label: "In progress", tone: "secondary" },
  completed: { label: "Completed", tone: "default" },
};

export default function DollarProgramPage() {
  // Local UI state mirrors the user's program seat. Persisted to the Zustand
  // store so enrollment survives reloads across the app session.
  const [enrollment, setEnrollment] = useState<EnrollmentState>(
    () => useAppStore.getState().dollarProgramEnrollment ?? "not_enrolled",
  );

  function persist(next: EnrollmentState) {
    setEnrollment(next);
    useAppStore.setState({ dollarProgramEnrollment: next });
  }

  function handleEnroll() {
    if (enrollment !== "not_enrolled") return;
    persist("in_progress");
    toast.success("You're enrolled in the $1 Program.", {
      description: "Your evaluation track is now active in the Practice Arena.",
    });
  }

  function handleMarkCompleted() {
    if (enrollment !== "in_progress") return;
    persist("completed");
    toast.success("Evaluation passed. Funding unlocked.", {
      description: "Your program seat is marked complete.",
    });
  }

  function handleReset() {
    persist("not_enrolled");
    toast("Program seat cleared.", {
      description: "You can re-enroll at any time.",
    });
  }

  const status = STATUS_META[enrollment];

  return (
    <div className="flex flex-col gap-10" data-ocid="dollar_program.page">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        data-ocid="dollar_program.header"
      >
        <span className="label-apple uppercase tracking-widest">
          Aegis Quantum
        </span>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight font-display">
            $1 Program
          </h1>
          <Badge variant={status.tone} data-ocid="dollar_program.status_badge">
            {status.label}
          </Badge>
        </div>
        <p className="text-base text-muted-foreground mt-2 max-w-2xl">
          Fund your seat with a single dollar, prove your edge on paper, and
          unlock a funded trading account. The same disciplined risk controls
          that power every Aegis module govern the evaluation.
        </p>
      </motion.section>

      {/* Status + enrollment card */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        data-ocid="dollar_program.enrollment_card"
      >
        <Card className="metric-card rounded-2xl bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold tracking-tight">
              Your program seat
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <EnrollmentProgress state={enrollment} />

            <div className="flex flex-wrap items-center gap-3">
              {enrollment === "not_enrolled" && (
                <Button
                  size="lg"
                  onClick={handleEnroll}
                  data-ocid="dollar_program.enroll_button"
                >
                  <Wallet className="size-4" />
                  Enroll for $1
                </Button>
              )}
              {enrollment === "in_progress" && (
                <>
                  <Button
                    size="lg"
                    onClick={handleMarkCompleted}
                    data-ocid="dollar_program.complete_button"
                  >
                    <Check className="size-4" />
                    Mark evaluation complete
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleReset}
                    data-ocid="dollar_program.reset_button"
                  >
                    Leave program
                  </Button>
                </>
              )}
              {enrollment === "completed" && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleReset}
                  data-ocid="dollar_program.reset_button"
                >
                  Reset seat
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* How it works */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        data-ocid="dollar_program.steps"
      >
        <h2 className="text-xl font-semibold tracking-tight mb-4">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PROGRAM_STEPS.map((step, idx) => (
            <motion.div
              key={step.index}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.4,
                delay: idx * 0.1,
                ease: "easeOut",
              }}
            >
              <Card className="metric-card rounded-2xl bg-card h-full">
                <CardHeader className="flex flex-row items-center gap-3">
                  <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent text-foreground">
                    <step.icon
                      className="w-[18px] h-[18px]"
                      strokeWidth={1.75}
                    />
                  </span>
                  <span className="label-apple">Step {step.index}</span>
                </CardHeader>
                <CardContent>
                  <h3 className="text-base font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Eligibility + benefits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.section
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          data-ocid="dollar_program.eligibility"
        >
          <Card className="metric-card rounded-2xl bg-card h-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold tracking-tight">
                Eligibility
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-4">
                {ELIGIBILITY.map((item, idx) => (
                  <li
                    key={item.label}
                    className="flex items-start gap-3"
                    data-ocid={`dollar_program.eligibility.item.${idx + 1}`}
                  >
                    <span className="mt-0.5 flex items-center justify-center w-5 h-5 rounded-full bg-accent text-foreground flex-shrink-0">
                      <Check className="w-3 h-3" strokeWidth={2.5} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium tracking-tight">
                        {item.label}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          data-ocid="dollar_program.benefits"
        >
          <Card className="metric-card rounded-2xl bg-card h-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold tracking-tight">
                Why the $1 Program
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-4">
                {BENEFITS.map((benefit, idx) => (
                  <li
                    key={benefit.title}
                    className="flex items-start gap-3"
                    data-ocid={`dollar_program.benefit.item.${idx + 1}`}
                  >
                    <span className="mt-0.5 flex items-center justify-center w-9 h-9 rounded-xl bg-accent text-foreground flex-shrink-0">
                      <benefit.icon
                        className="w-[18px] h-[18px]"
                        strokeWidth={1.75}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium tracking-tight">
                        {benefit.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.section>
      </div>

      {/* Disclaimer */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        data-ocid="dollar_program.disclaimer"
      >
        <div className="rounded-2xl border border-border bg-muted/40 p-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">
              Practice-only evaluation.
            </span>{" "}
            The $1 Program runs on paper capital during the evaluation phase.
            Funding terms, profit share, and account sizing are determined after
            the evaluation is passed and are subject to program availability.
          </p>
        </div>
      </motion.section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Enrollment progress indicator                                      */
/* ------------------------------------------------------------------ */

function EnrollmentProgress({ state }: { state: EnrollmentState }) {
  const stages: { key: EnrollmentState; label: string; icon: LucideIcon }[] = [
    { key: "not_enrolled", label: "Enroll", icon: Wallet },
    { key: "in_progress", label: "Evaluate", icon: Clock },
    { key: "completed", label: "Funded", icon: Trophy },
  ];

  const activeIndex = stages.findIndex((s) => s.key === state);

  return (
    <ol className="flex items-center gap-2" data-ocid="dollar_program.progress">
      {stages.map((stage, idx) => {
        const isComplete = idx < activeIndex;
        const isActive = idx === activeIndex;
        const Icon = stage.icon;
        return (
          <li
            key={stage.key}
            className="flex items-center gap-2 flex-1 min-w-0"
            data-ocid={`dollar_program.progress.item.${idx + 1}`}
          >
            <span
              className={[
                "flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 transition-smooth",
                isComplete || isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-muted-foreground",
              ].join(" ")}
            >
              {isComplete ? (
                <Check className="w-4 h-4" strokeWidth={2.5} />
              ) : (
                <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
              )}
            </span>
            <span
              className={[
                "text-sm font-medium tracking-tight truncate",
                isActive ? "text-foreground" : "text-muted-foreground",
              ].join(" ")}
            >
              {stage.label}
            </span>
            {idx < stages.length - 1 && (
              <span
                className={[
                  "h-px flex-1 min-w-4 transition-smooth",
                  isComplete ? "bg-foreground/40" : "bg-border",
                ].join(" ")}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
