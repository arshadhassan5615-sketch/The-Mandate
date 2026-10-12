// Full-screen location art behind a conversation (Suzerain-style S04 layout).
// Scenes carry a location string, not art, so the backdrop is the banner of the
// province the location resolves to, dimmed so the text and portrait read on it.
import { resolveLocation, type ProvinceId } from '../../engine/LocationResolver'
import { Z } from '../../constants/zIndex'
import ashenmereBanner from '../../assets/images/provinces/ashenmere_banner.jpeg'
import kravenstalBanner from '../../assets/images/provinces/kravenstal_banner.jpeg'
import dravenhollowBanner from '../../assets/images/provinces/dravenhollow_banner.jpeg'
import thornfeldBanner from '../../assets/images/provinces/thornfeld_banner.jpeg'
import aldenmoorBanner from '../../assets/images/provinces/aldenmoor_banner.jpeg'
import sevagradBanner from '../../assets/images/provinces/sevagrad_banner.jpeg'
import sovarkaBanner from '../../assets/images/provinces/sovarka_banner.jpeg'

const BANNERS: Record<ProvinceId, string> = {
  ashenmere: ashenmereBanner,
  kravenstal: kravenstalBanner,
  dravenhollow: dravenhollowBanner,
  thornfeld: thornfeldBanner,
  aldenmoor: aldenmoorBanner,
  sevagrad: sevagradBanner,
  sovarka: sovarkaBanner,
  // Abroad has no art of its own; the capital stands in for the seat of government.
  foreign: ashenmereBanner,
}

function backdropFor(location: string | undefined): string {
  return BANNERS[resolveLocation(location ?? '')] ?? ashenmereBanner
}

export default function SceneBackdrop({ location, isEmergency }: { location?: string; isEmergency: boolean }) {
  return (
    <div
      aria-hidden
      data-testid="scene-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z.sceneBackdrop,
        pointerEvents: 'none',
        backgroundColor: '#070605',
        backgroundImage: [
          // Vignette and a darker right side where the text column sits
          'radial-gradient(ellipse at 35% 45%, rgba(7,6,5,0.15) 0%, rgba(7,6,5,0.75) 75%)',
          'linear-gradient(90deg, rgba(7,6,5,0.35) 0%, rgba(7,6,5,0.1) 40%, rgba(7,6,5,0.8) 100%)',
          isEmergency ? 'linear-gradient(rgba(120,20,15,0.18), rgba(120,20,15,0.18))' : 'linear-gradient(transparent, transparent)',
          `url(${backdropFor(location)})`,
        ].join(', '),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'saturate(0.7) brightness(0.62)',
        animation: 'panel-fade-in 0.6s ease-out forwards',
      }}
    />
  )
}
