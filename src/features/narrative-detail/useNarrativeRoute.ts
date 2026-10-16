import { useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

const PARAM = 'narrative';

/**
 * The narrative deep-dive is addressed by `?narrative=<id>` so it can open
 * over any tab, is shareable, and the browser Back button closes it.
 */
export function useNarrativeRoute() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const openId = params.get(PARAM);

  const open = useCallback(
    (id: string) =>
      setParams(
        (p) => {
          p.set(PARAM, id);
          return p;
        },
        { state: { overlay: true } },
      ),
    [setParams],
  );

  const close = useCallback(() => {
    if ((location.state as { overlay?: boolean } | null)?.overlay) navigate(-1);
    else
      setParams(
        (p) => {
          p.delete(PARAM);
          p.delete('tab');
          return p;
        },
        { replace: true },
      );
  }, [location.state, navigate, setParams]);

  return { openId, open, close };
}
