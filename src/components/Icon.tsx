export function Icon({name,size=20}:{name:string;size?:number}) {
  const paths:Record<string,string> = {
    caliper:'M4 4v16h3v-7h11v7h3V4M7 7h14M11 5v4M15 5v4M19 5v4',
    arrow:'M5 12h14M13 6l6 6-6 6', rotate:'M20 7v5h-5M4 17v-5h5M5.2 8a8 8 0 0 1 13-3L20 7M4 17l1.8 2a8 8 0 0 0 13-3',
    lock:'M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5zM12 15v3', unlock:'M7 11V7a5 5 0 0 1 10-1M5 11h14v10H5zM12 15v3',
    lens:'M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14M15 15l6 6M7 10h6M10 7v6',
    settings:'M4 7h16M4 17h16M8 4v6M16 14v6', sound:'M3 9h4l5-4v14l-5-4H3zM16 8a6 6 0 0 1 0 8M19 4a11 11 0 0 1 0 16', mute:'M3 9h4l5-4v14l-5-4H3zM16 9l6 6M16 15l6-6',
    check:'M4 12l5 5L20 6', close:'M5 5l14 14M5 19L19 5', expand:'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5', download:'M12 3v12M7 10l5 5 5-5M4 17v4h16v-4',
    book:'M12 5c-3-2-7-2-9 0v15c3-2 6-2 9 0 3-2 6-2 9 0V5c-3-2-6-2-9 0v15', globe:'M3 12h18M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 3c-6 5-6 13 0 18 6-5 6-13 0-18', help:'M9 8a3 3 0 1 1 4 3c-1 1-1 2-1 3M12 17v1M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20',
    minus:'M5 12h14',plus:'M5 12h14M12 5v14', reset:'M3 10a9 9 0 1 1 2 8M3 3v7h7', info:'M12 11v6M12 7v.1M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20',
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]??paths.info}/></svg>;
}
