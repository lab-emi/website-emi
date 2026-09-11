import { site } from './site';

// Keep this person ID aligned with the profile on gaochangw.github.io.
export const changGao = {
  id: 'https://gaochangw.github.io/#person',
  url: 'https://gaochangw.github.io/',
  name: 'Chang Gao',
  role: 'Tenured Assistant Professor',
  orcid: 'https://orcid.org/0000-0002-3284-4078',
  universityProfile: 'https://microelectronics.tudelft.nl/People/bio.php?id=840',
  linkedin: 'https://www.linkedin.com/in/gaochangw/',
  github: 'https://github.com/gaochangw',
  portrait: 'https://gaochangw.github.io/images/chang-gao.webp',
};

export const universitySchema = {
  '@type': 'CollegeOrUniversity',
  '@id': 'https://www.tudelft.nl/#organization',
  name: 'Delft University of Technology',
  alternateName: 'TU Delft',
  url: 'https://www.tudelft.nl/',
};

export const labSchema = {
  '@type': 'Organization',
  '@id': 'https://www.tudemi.com/#organization',
  name: site.fullName,
  alternateName: site.name,
  url: 'https://www.tudemi.com/',
  description: site.description,
  parentOrganization: universitySchema,
  employee: { '@id': changGao.id },
  sameAs: [site.github],
};

export const personSchema = {
  '@type': 'Person',
  '@id': changGao.id,
  name: changGao.name,
  givenName: 'Chang',
  familyName: 'Gao',
  honorificPrefix: 'Dr.',
  url: changGao.url,
  image: changGao.portrait,
  jobTitle: changGao.role,
  description: 'Chang Gao is a tenured assistant professor in the Department of Microelectronics at TU Delft and leads the Lab of Efficient Machine Intelligence (EMI). His research focuses on energy-efficient edge AI and neuromorphic algorithm–hardware co-design.',
  worksFor: universitySchema,
  affiliation: { '@id': labSchema['@id'] },
  mainEntityOfPage: `${changGao.url}#profile-page`,
  sameAs: [changGao.orcid, changGao.universityProfile, site.scholar, changGao.linkedin, changGao.github, 'https://www.innovatorsunder35.com/the-list/chang-gao/'],
};

export const jsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');
