import { beforeAll, describe, expect, it } from "vitest";
import { setupTestDb } from "../helpers/db";
import { cities, colleges } from "@/db";
import { validateRegistrationReferences } from "@/modules/identity/registration";

describe("registration city and college references", () => {
  let cityId: string;
  let otherCityId: string;
  let collegeId: string;

  beforeAll(async () => {
    const d = await setupTestDb();
    const [city, otherCity] = await d.insert(cities).values([
      { name: "Registration City", slug: "registration-city", state: "Test" },
      { name: "Other Registration City", slug: "other-registration-city", state: "Test" },
    ]).returning();
    cityId = city.id;
    otherCityId = otherCity.id;
    const [college] = await d.insert(colleges).values({
      name: "Registration College",
      slug: "registration-college",
      cityId,
    }).returning();
    collegeId = college.id;
  });

  it("accepts a college-city pair that belongs together", async () => {
    await expect(validateRegistrationReferences(cityId, collegeId)).resolves.toBeUndefined();
  });

  it("rejects a college paired with another city", async () => {
    await expect(validateRegistrationReferences(otherCityId, collegeId)).rejects.toMatchObject({
      status: 400,
      message: "College does not belong to the selected city",
    });
  });

  it("allows a known college without a city for compatibility", async () => {
    await expect(validateRegistrationReferences(undefined, collegeId)).resolves.toBeUndefined();
  });
});
