export type DermiMood = "happy" | "thinking" | "concerned";

const FACES: Record<DermiMood, { eyeL: number; eyeR: number; eyeY: number; mouth: string; brows: string }> = {
  happy: { eyeL: 47, eyeR: 74, eyeY: 58, mouth: "M50.5 71.5 Q57 79.5 69.5 72", brows: "" },
  thinking: {
    eyeL: 51,
    eyeR: 77,
    eyeY: 54,
    mouth: "M57 74.5 Q61.5 72.5 66.5 74",
    brows: "M46 45.5 Q51 42 56.5 44",
  },
  concerned: {
    eyeL: 47,
    eyeR: 74,
    eyeY: 59,
    mouth: "M52 76 Q60 71.5 68.5 75.5",
    brows: "M40 50.5 L50.5 46.5 M70.5 46.2 L81 50.8",
  },
};

type DermiProps = {
  size?: number;
  mood?: DermiMood;
  /** Body fill. Rock tint by default; merino when Dermi sits on a Rock Blue panel. */
  body?: string;
  /** Decorative by default. Pass a label when Dermi carries meaning on its own. */
  label?: string;
  className?: string;
};

/** Dermi, the hand-drawn mascot (design/screens/Dermi.dc.html). */
export function Dermi({ size = 120, mood = "happy", body = "#A9CBDD", label, className }: DermiProps) {
  const f = FACES[mood];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={`shrink-0 ${className ?? ""}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path
        d="M40 112.5 Q60 109.5 84 112"
        fill="none"
        stroke="#16587B"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M61 20C86 18 105 37 104 64C103 91 85 107 60 106C35 105 18 90 19 65C19 40 36 22 61 20Z"
        fill={body}
      />
      <path
        d="M51 18.6C78 12.5 103.5 31 103.5 61.5C104.5 90 86 105.5 59 104.8C33 104.2 15.8 88.6 16.2 63.2C16.4 40.5 30.5 22.6 55.5 17.8"
        fill="none"
        stroke="#16587B"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 43.5Q35.5 35 43.5 31.5"
        fill="none"
        stroke="#F5EEDD"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M30.5 72.5l4.5-3.2M34.5 74.6l4.5-3.2M81 69.4l4.5 3.2M85 67.3l4.5 3.2"
        fill="none"
        stroke="#16587B"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      {f.brows && (
        <path d={f.brows} fill="none" stroke="#16587B" strokeWidth="2.4" strokeLinecap="round" />
      )}
      <ellipse
        cx={f.eyeL}
        cy={f.eyeY}
        rx="3.4"
        ry="4.4"
        fill="#16587B"
        transform={`rotate(-6 ${f.eyeL} ${f.eyeY})`}
      />
      <ellipse
        cx={f.eyeR}
        cy={f.eyeY}
        rx="3.8"
        ry="4.7"
        fill="#16587B"
        transform={`rotate(5 ${f.eyeR} ${f.eyeY})`}
      />
      <path
        d={f.mouth}
        fill="none"
        stroke="#16587B"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
