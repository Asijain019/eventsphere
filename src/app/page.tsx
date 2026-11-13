import { cookies } from "next/headers";
import { DEFAULT_CITY } from "@/lib/constants";
import { getHomeData } from "@/modules/home/service";
import { Hero } from "@/components/home/Hero";
import { Marquee } from "@/components/home/Marquee";
import { SectionHead } from "@/components/home/SectionHead";
import { EventGrid } from "@/components/home/EventGrid";
import { CategoryMosaic } from "@/components/home/CategoryMosaic";
import { Nightlife } from "@/components/home/Nightlife";
import { HackathonSpotlight } from "@/components/home/HackathonSpotlight";
import { EditorialShowcase } from "@/components/home/EditorialShowcase";
import { CommunitiesSection } from "@/components/home/CommunitiesSection";
import { TeamTeaser } from "@/components/home/TeamTeaser";
import { HowItWorks } from "@/components/home/HowItWorks";
import { OrganizerCTA } from "@/components/home/OrganizerCTA";
import { BrandStrip } from "@/components/home/BrandStrip";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: { city?: string } }) {
  const city = (searchParams.city || cookies().get("es_city")?.value || DEFAULT_CITY).toLowerCase().replace(/[^a-z0-9-]/g, "");
  const d = await getHomeData(city);
  const cityName = d.cityList.find((c) => c.slug === city)?.name ?? city.charAt(0).toUpperCase() + city.slice(1);
  return (
    <>
      <Hero cities={d.cityList} city={city} cityName={cityName} stats={d.stats} />
      <Marquee />

      <section className="container-x py-14 sm:py-16">
        <SectionHead kicker={`Featured in ${cityName}`} title={<>Happening <span className="text-lime">soon.</span></>} sub="Hand-picked, upcoming and open for registration." href={`/events?city=${city}`} cta="View all events" />
        <EventGrid events={d.featured} cityName={cityName} />
      </section>

      <section className="container-x pb-14 sm:pb-16">
        <SectionHead kicker="Explore by category" title={<>Pick your <span className="text-magenta">scene.</span></>} href="/events" cta="All categories" />
        <CategoryMosaic counts={d.categoryCounts} />
      </section>

      <Nightlife events={d.music} cityName={cityName} />
      <BrandStrip />
      <HackathonSpotlight events={d.hackathons} cityName={cityName} />

      <section className="container-x py-14 sm:py-16">
        <SectionHead kicker="Trending near you" title={<>Everyone&apos;s going to <span className="text-violet-400">these.</span></>} sub={`Most-registered upcoming events in ${cityName}.`} href={`/events?city=${city}&sort=popular`} />
        <EventGrid events={d.trending} cityName={cityName} cols={4} />
      </section>

      <EditorialShowcase />
      <CommunitiesSection communities={d.communityList} />
      <TeamTeaser />
      <HowItWorks />
      <OrganizerCTA />
    </>
  );
}
