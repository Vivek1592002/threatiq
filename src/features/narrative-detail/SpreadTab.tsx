import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BarList } from '@/components/charts/BarList';
import { ContagionChart } from '@/components/charts/ContagionChart';
import { InfoTip, Pill, Segmented } from '@/components/ui/controls';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { Icon } from '@/components/ui/Icon';
import { Panel } from '@/components/ui/Panel';
import { PlatformIcon } from '@/components/ui/PlatformIcon';
import { PLATFORM_LABEL, narrativePlatforms, tierBreakdown, tierOf } from '@/lib/analytics';
import { compact, full } from '@/lib/format';
import { profileUrl } from '@/lib/sanitize';
import { authTone, botTone, toneVar, verdictTone } from '@/lib/threat';
import type { Narrative, PlatformFilter, Stance, Tone } from '@/types/domain';
import s from './detail.module.css';

const STANCE_TONE: Record<Stance, Tone> = { positive: 'pos', negative: 'neg', neutral: 'neu' };

export function SpreadTab({ narrative: n }: { narrative: Narrative }) {
  return (
    <div className={s.stack}>
      <div className={s.split}>
        <AuthenticityPanel n={n} />
        <Panel title="How it originated and spread" subtitle="Mentions across platforms over time · hover a node">
          <ContagionChart hops={n.contagion} />
        </Panel>
      </div>
      <AmplifierLeaderboard n={n} />
      <div className={s.split}>
        <Panel title="Influence tiers" subtitle="Reach by follower band · # accounts">
          <BarList
            ariaLabel="Reach by influence tier"
            rows={tierBreakdown(n.amplifiers).map((t) => ({
              key: t.tier,
              label: t.tier,
              sub: `· ${t.count}`,
              value: t.reach,
              color: 'var(--acc)',
              valueLabel: compact(t.reach),
            }))}
          />
        </Panel>
        <Panel title="Origin & geography">
          <dl className={s.facts}>
            <div>
              <dt>Patient zero</dt>
              <dd>{n.origin}</dd>
            </div>
            <div>
              <dt>Carried in</dt>
              <dd>{n.geo}</dd>
            </div>
            {n.coordinationNote && (
              <div>
                <dt>Coordination read</dt>
                <dd className={s.factNote}>{n.coordinationNote}</dd>
              </div>
            )}
          </dl>
        </Panel>
      </div>
    </div>
  );
}

function AuthenticityPanel({ n }: { n: Narrative }) {
  const [showCopies, setShowCopies] = useState(false);
  const sp = n.spread;
  const c = n.cluster;

  return (
    <Panel title="Authenticity & coordination" subtitle="Organic or manufactured?">
      <div className={s.authGrid}>
        <div className={s.astat}>
          <div className={s.alabel}>Total accounts</div>
          <div className={`${s.avalue} num`}>{compact(sp.totalAccounts)}</div>
          <div className={s.ahint}>posting about this narrative</div>
        </div>
        <div className={s.astat}>
          <div className={s.alabel}>
            Likely bots
            <InfoTip label="How bots are flagged">
              Flagged as a likely bot when the account was created in the past 2 days, or has no other posts and is posting only about this narrative.
            </InfoTip>
          </div>
          <div className={`${s.avalue} num`} style={{ color: toneVar(botTone(sp.botPct)) }}>
            {compact(sp.botAccounts)}
          </div>
          <div className={s.ahint}>{sp.botPct}% of accounts</div>
        </div>
        <button type="button" className={`${s.astat} ${s.astatBtn}`} aria-expanded={showCopies} onClick={() => setShowCopies((v) => !v)}>
          <div className={s.alabel}>Same-comment clusters</div>
          <div className={`${s.avalue} num`}>{sp.copypasta.length}</div>
          <div className={s.ahint}>
            identical comments · {showCopies ? 'hide' : 'view'}{' '}
            <Icon name="chevronDown" size={12} style={{ transform: showCopies ? 'rotate(180deg)' : undefined, transition: 'transform 160ms' }} />
          </div>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showCopies && (
          <motion.ul
            className={s.copies}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
          >
            {sp.copypasta.map((cp) => (
              <li key={cp.text} className={s.copy}>
                <span className={s.copyText}>“{cp.text}”</span>
                <span className={s.copyCount}>
                  <b className="num">{full(cp.accounts)}</b> accounts posting this verbatim
                </span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {c && (
        <div className={s.cluster} style={{ borderColor: toneVar(verdictTone(c.verdict)) }}>
          <div className={s.clusterHead}>
            <span className={s.clusterName}>{c.name}</span>
            <Pill tone={verdictTone(c.verdict)}>{c.verdict}</Pill>
          </div>
          <div className={s.clusterFacts}>
            <span>
              Accounts <b className="num">{full(c.accounts)}</b>
            </span>
            <span>
              Avg age <b className="num">{c.ageDays}d</b>
            </span>
            <span>
              Duplication <b className="num">{c.duplication}%</b>
            </span>
            <span>
              Synced bursts <b className="num">{c.bursts}%</b>
            </span>
            <span>
              Reach <b className="num">{compact(c.reach)}</b>
            </span>
          </div>
        </div>
      )}
    </Panel>
  );
}

function AmplifierLeaderboard({ n }: { n: Narrative }) {
  const [platform, setPlatform] = useState<PlatformFilter>('all');
  const rows = useMemo(
    () =>
      n.amplifiers
        .filter((a) => platform === 'all' || a.platform === platform)
        .sort((a, b) => b.reach - a.reach)
        .slice(0, 10),
    [n.amplifiers, platform],
  );
  const options = [
    { value: 'all' as PlatformFilter, label: 'All' },
    ...narrativePlatforms(n).map((k) => ({
      value: k as PlatformFilter,
      label: (
        <>
          <PlatformIcon platform={k} size={13} />
          {PLATFORM_LABEL[k]}
        </>
      ),
    })),
  ];

  return (
    <Panel
      flush
      title="Amplifier leaderboard"
      subtitle="Top 10 accounts by reach · open a handle to visit the profile"
      actions={<Segmented label="Filter by platform" value={platform} options={options} onChange={setPlatform} />}
    >
      <div className={s.tableScroll}>
        <table className={`${s.table} ${s.ampTable}`}>
          <thead>
            <tr>
              <th>#</th>
              <th>Account</th>
              <th>Platform</th>
              <th>Tier</th>
              <th>Followers</th>
              <th>Reach</th>
              <th>Stance</th>
              <th>Authenticity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a, i) => {
              const au = a.authenticity ?? 70;
              return (
                <tr key={`${a.platform}-${a.handle}`}>
                  <td className={`${s.rank} num`}>{String(i + 1).padStart(2, '0')}</td>
                  <td>
                    <span className={s.handleCell}>
                      <ExternalLink href={profileUrl(a.handle, a.platform)} className={s.handle}>
                        {a.handle}
                        <Icon name="external" size={12} />
                      </ExternalLink>
                      {a.burst && <Pill tone="neg">burst</Pill>}
                    </span>
                  </td>
                  <td>
                    <span className={s.platCell}>
                      <PlatformIcon platform={a.platform} size={15} />
                      {PLATFORM_LABEL[a.platform]}
                    </span>
                  </td>
                  <td className={s.muted}>{tierOf(a.followers)}</td>
                  <td className="num">{compact(a.followers)}</td>
                  <td className="num" style={{ fontWeight: 650 }}>
                    {compact(a.reach)}
                  </td>
                  <td>
                    <Pill tone={STANCE_TONE[a.stance]}>{a.stance}</Pill>
                  </td>
                  <td>
                    <span className={s.authCell}>
                      <span className={s.authTrack}>
                        <i style={{ width: `${au}%`, background: toneVar(authTone(au)) }} />
                      </span>
                      <b className="num" style={{ color: toneVar(authTone(au)) }}>
                        {au}
                      </b>
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className={s.muted} style={{ textAlign: 'center', padding: 28 }}>
                  No accounts for this platform.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
