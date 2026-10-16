import { forwardRef, useId, type ButtonHTMLAttributes, type CSSProperties, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { motion } from 'motion/react';
import type { Tone } from '@/types/domain';
import { cx, toneStyle } from '@/lib/style';
import { Icon, type IconName } from './Icon';
import s from './controls.module.css';


/* ---------- Button ---------- */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  icon?: IconName;
  pressed?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, pressed, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={pressed}
      className={cx(s.btn, s[size], s[variant], pressed && s.toggleOn, className)}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 15} />}
      {children}
    </button>
  );
});

/* ---------- IconButton ---------- */
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  label: string;
  bare?: boolean;
  size?: number;
}

export function IconButton({ icon, label, bare, size = 16, className, ...rest }: IconButtonProps) {
  return (
    <button type="button" aria-label={label} title={label} className={cx(s.iconBtn, bare && s.iconBtnBare, className)} {...rest}>
      <Icon name={icon} size={size} />
    </button>
  );
}

/* ---------- Select ---------- */
export interface Option<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  label: string;
}

export function Select<T extends string>({ value, options, onChange, label, className, ...rest }: SelectProps<T>) {
  return (
    <span className={cx(s.selectWrap, className)}>
      <select aria-label={label} className={s.select} value={value} onChange={(e) => onChange(e.target.value as T)} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="chevronDown" size={14} className={s.selectChevron} />
    </span>
  );
}

/* ---------- Segmented ---------- */
interface SegmentedProps<T extends string | number> {
  value: T;
  options: readonly { value: T; label: ReactNode }[];
  onChange: (value: T) => void;
  label: string;
  size?: 'sm' | 'lg';
}

export function Segmented<T extends string | number>({ value, options, onChange, label, size = 'sm' }: SegmentedProps<T>) {
  const layoutId = useId();
  return (
    <div className={s.segmented} role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            className={cx(s.segment, size === 'lg' && s.segmentLg, on && s.segmentOn)}
            onClick={() => onChange(o.value)}
          >
            {on && <motion.span layoutId={layoutId} className={s.segmentThumb} transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Checkbox ---------- */
export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Checkbox(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} type="checkbox" className={cx(s.check, className)} {...rest} />;
});

/* ---------- TextInput ---------- */
interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: IconName;
  inputSize?: 'sm' | 'md';
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { icon, inputSize = 'md', className, ...rest },
  ref,
) {
  return (
    <span className={cx(s.inputWrap, className)}>
      {icon && <Icon name={icon} size={15} className={s.inputIcon} />}
      <input ref={ref} type="text" className={cx(s.input, inputSize === 'sm' && s.sm, icon && s.inputWithIcon)} {...rest} />
    </span>
  );
});

/* ---------- Pill ---------- */
export function Pill({ tone, children, dot }: { tone: Tone | string; children: ReactNode; dot?: boolean }) {
  return (
    <span className={s.pill} style={toneStyle(tone)}>
      {dot && <span className={s.pillDot} />}
      {children}
    </span>
  );
}

/* ---------- Delta ---------- */
interface DeltaProps {
  value: number;
  /** When true, a decrease is good (e.g. threat). */
  goodDown?: boolean;
  suffix?: string;
  plain?: boolean;
  format?: (n: number) => string;
}

export function Delta({ value, goodDown = true, suffix = '', plain, format }: DeltaProps) {
  const flat = value === 0;
  const up = value > 0;
  const tone: Tone = flat ? 'neu' : up === goodDown ? 'neg' : 'pos';
  const arrow = flat ? '→' : up ? '▲' : '▼';
  const text = format ? format(value) : `${up ? '+' : ''}${value}`;
  return (
    <span className={plain ? s.deltaPlain : s.delta} style={toneStyle(plain ? (flat ? 'neu' : 'ink-2') : tone)}>
      <span aria-hidden="true">{arrow}</span>
      {text}
      {suffix}
    </span>
  );
}

/* ---------- Stat ---------- */
interface StatProps {
  label: ReactNode;
  value: ReactNode;
  tone?: Tone | string;
  hint?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Stat({ label, value, tone, hint, className, style }: StatProps) {
  return (
    <div className={cx(s.stat, className)} style={{ ...(tone ? toneStyle(tone) : null), ...style }}>
      <div className={s.statLabel}>{label}</div>
      <div className={s.statValue}>{value}</div>
      {hint && <div className={s.statHint}>{hint}</div>}
    </div>
  );
}

/* ---------- InfoTip ---------- */
export function InfoTip({ children, label = 'More info' }: { children: ReactNode; label?: string }) {
  return (
    <span className={s.info} tabIndex={0} aria-label={label} role="note">
      <Icon name="info" size={13} />
      <span className={s.infoBubble}>{children}</span>
    </span>
  );
}

