import { ReactNode, Children } from "react";

interface StepProps {
  title: string;
  children: ReactNode;
}

export function HelpStep({ title, children }: StepProps) {
  return (
    <div className="not-prose flex gap-4">
      <div className="flex flex-col items-center">
        <div className="step-number flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          ?
        </div>
        <div className="step-line mt-2 w-px flex-1 bg-border" />
      </div>
      <div className="flex-1 pb-6">
        <h4 className="mb-1 text-base font-semibold text-foreground">{title}</h4>
        <div className="text-sm leading-relaxed text-muted-foreground [&>p]:mt-1 [&>ul]:mt-2 [&>ul]:ml-5 [&>ul]:list-disc">
          {children}
        </div>
      </div>
    </div>
  );
}

interface StepsProps {
  children: ReactNode;
}

export function HelpSteps({ children }: StepsProps) {
  const items = Children.toArray(children);
  return (
    <div className="not-prose my-5">
      {items.map((child, i) => (
        <NumberedStep key={i} index={i + 1} isLast={i === items.length - 1}>
          {child}
        </NumberedStep>
      ))}
    </div>
  );
}

function NumberedStep({
  index,
  isLast,
  children,
}: {
  index: number;
  isLast: boolean;
  children: ReactNode;
}) {
  // Wraps a HelpStep child and injects the numeric badge + connector.
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {index}
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-border" />}
      </div>
      <div className="flex-1 pb-5">{children}</div>
    </div>
  );
}

export function StepBody({ title, children }: StepProps) {
  return (
    <>
      <h4 className="mb-1 text-base font-semibold text-foreground">{title}</h4>
      <div className="text-sm leading-relaxed text-muted-foreground [&>p]:mt-1 [&>ul]:mt-2 [&>ul]:ml-5 [&>ul]:list-disc [&_strong]:text-foreground">
        {children}
      </div>
    </>
  );
}
