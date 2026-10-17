import { useCallback, useEffect, useState } from 'react';

import { policiesService } from '../../../api';
import {
  buildConsentBody,
  missingConsents,
  parseConsentRequirements,
  type ConsentBody,
  type ConsentChecks,
  type ConsentKind,
  type ConsentRequirement,
} from '../utils/consent';

export type RegistrationConsent = {
  requirements: ConsentRequirement[];
  checks: ConsentChecks;
  /** Kinds the user tried to submit without ticking. */
  errors: ConsentKind[];
  isLoading: boolean;
  loadFailed: boolean;
  toggle: (kind: ConsentKind) => void;
  retry: () => void;
  /** Marks unticked boxes and returns true when registration may proceed. */
  validate: () => boolean;
  body: () => ConsentBody;
  /** Re-fetch after the server says a newer version is required. */
  refresh: () => void;
};

/** Loads the active terms / privacy versions and tracks the checkboxes, like the web form. */
export function useRegistrationConsent(): RegistrationConsent {
  const [requirements, setRequirements] = useState<ConsentRequirement[]>([]);
  const [checks, setChecks] = useState<ConsentChecks>({});
  const [errors, setErrors] = useState<ConsentKind[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadFailed(false);
    policiesService
      .getCurrentPolicies()
      .then((data) => {
        if (cancelled) return;
        setRequirements(parseConsentRequirements(data));
        setIsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadFailed(true);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const toggle = useCallback((kind: ConsentKind) => {
    setChecks((current) => ({ ...current, [kind]: !current[kind] }));
    setErrors((current) => current.filter((item) => item !== kind));
  }, []);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  const validate = useCallback(() => {
    const missing = missingConsents(requirements, checks);
    setErrors(missing);
    return missing.length === 0;
  }, [checks, requirements]);

  const body = useCallback(() => buildConsentBody(requirements), [requirements]);

  return {
    requirements,
    checks,
    errors,
    isLoading,
    loadFailed,
    toggle,
    retry,
    validate,
    body,
    refresh: retry,
  };
}
