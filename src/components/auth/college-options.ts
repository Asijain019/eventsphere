export type CollegeOption = { id: string; name: string; cityId: string };

export function collegesForCity(colleges: CollegeOption[], cityId: string): CollegeOption[] {
  return cityId ? colleges.filter((college) => college.cityId === cityId) : [];
}
