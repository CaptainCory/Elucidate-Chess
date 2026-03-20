import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PageSEOProps {
  title: string;
  description?: string;
}

const BASE_URL = 'https://think-chess-wise.lovable.app';
const DEFAULT_DESCRIPTION = 'The only chess puzzle trainer that scores your reasoning, not just your moves. Explain your thinking, get AI coaching. Free to try.';

export function PageSEO({ title, description }: PageSEOProps) {
  const location = useLocation();
  const fullTitle = title.includes('Elucidate') ? title : `${title} — Elucidate Chess`;
  const desc = description || DEFAULT_DESCRIPTION;
  const canonicalUrl = `${BASE_URL}${location.pathname}`;

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', desc);

    // Canonical link
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonicalUrl;
  }, [fullTitle, desc, canonicalUrl]);

  return null;
}
