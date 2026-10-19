/**
 * Cinderline Auto static-site configuration — schema contract v1.0.0.
 * Stable API: named ES-module export `config`; consume keys exactly as documented
 * by the frozen configuration contract. This file is plain static JavaScript and requires
 * no build step. Keep all business-specific values here; replace demo values when
 * rebranding. Social URLs may be null to hide their links. Prices are integer CAD
 * cents; annual totals are contract QA expectations, derived at runtime elsewhere.
 * All identity, people, review, certification, and price content is fictional.
 *
 * Schema outline (closed objects; no additional keys):
 * config.business: name, tagline, isDemo, phone{display,href},
 *   email{display,href}, address{street,locality,region,postalCode,country,display},
 *   timezone, hours[7]{day,opens,closes,closed}, socials{instagram,facebook}{label,url}
 * config.site: basePath, publicOrigin, locale, currency, defaultOgImage
 * config.pricing: taxIncluded, serviceStartingCents[8 service IDs], packages[essential,plus,complete]
 *   each package: name, monthlyCents, discountPercent, annualCents, savingsCents,
 *   equivalentMonthlyCents, features{inspections,oilCredits,tireRotations,priorityBooking,detailCredits}
 * config.demo: stats, reviews, team{maya,elias,jordan}, certifications{inspection,ev,care}
 * config.booking: mode, minLeadDays, maxAdvanceDays, timeWindows{morning,afternoon}, retention
 *
 * Contract invariants: seven ordered unique weekdays; closed hours use null times,
 * open times are valid HH:MM and open before close; phone href is tel:, email href
 * is mailto:, social URLs are null or HTTPS, site origin is HTTPS without trailing
 * slash, basePath begins/ends with slash, image path is relative, prices/allowances
 * are nonnegative integer cents/counts, review rating is within its scale, and
 * package derived totals match monthly pricing and discount. Booking is demo-only
 * with 1–90 day lead/advance bounds and memory-only retention.
 */
export const config = {
  "business": {
    "name": "Cinderline Auto",
    "tagline": "Precision for every mile.",
    "isDemo": true,
    "phone": {
      "display": "+1 (416) 555-0142",
      "href": "tel:+14165550142"
    },
    "email": {
      "display": "hello@cinderline.example",
      "href": "mailto:hello@cinderline.example"
    },
    "address": {
      "street": "100 Demo Lane",
      "locality": "Toronto",
      "region": "ON",
      "postalCode": "DEMO",
      "country": "CA",
      "display": "100 Demo Lane, Toronto, ON — fictional demo address"
    },
    "timezone": "America/Toronto",
    "hours": [
      {
        "day": "Monday",
        "opens": "08:00",
        "closes": "18:00",
        "closed": false
      },
      {
        "day": "Tuesday",
        "opens": "08:00",
        "closes": "18:00",
        "closed": false
      },
      {
        "day": "Wednesday",
        "opens": "08:00",
        "closes": "18:00",
        "closed": false
      },
      {
        "day": "Thursday",
        "opens": "08:00",
        "closes": "18:00",
        "closed": false
      },
      {
        "day": "Friday",
        "opens": "08:00",
        "closes": "18:00",
        "closed": false
      },
      {
        "day": "Saturday",
        "opens": null,
        "closes": null,
        "closed": true
      },
      {
        "day": "Sunday",
        "opens": null,
        "closes": null,
        "closed": true
      }
    ],
    "socials": {
      "instagram": {
        "label": "Instagram",
        "url": null
      },
      "facebook": {
        "label": "Facebook",
        "url": null
      }
    }
  },
  "site": {
    "basePath": "/auto-shop-5k/",
    "publicOrigin": "https://tl635131-svg.github.io",
    "locale": "en-CA",
    "currency": "CAD",
    "defaultOgImage": "assets/images/hero-workshop.webp"
  },
  "pricing": {
    "taxIncluded": false,
    "serviceStartingCents": {
      "diagnostics": 12900,
      "brakes": 18900,
      "oil-maintenance": 9900,
      "tires-alignment": 13900,
      "ev-hybrid": 15900,
      "engine-transmission": 19900,
      "ac-climate": 14900,
      "detailing": 17900
    },
    "packages": {
      "essential": {
        "name": "Essential",
        "monthlyCents": 2900,
        "discountPercent": 10,
        "annualCents": 31320,
        "savingsCents": 3480,
        "equivalentMonthlyCents": 2610,
        "features": {
          "inspections": 1,
          "oilCredits": 1,
          "tireRotations": 1,
          "priorityBooking": false,
          "detailCredits": 0
        }
      },
      "plus": {
        "name": "Plus",
        "monthlyCents": 4900,
        "discountPercent": 10,
        "annualCents": 52920,
        "savingsCents": 5880,
        "equivalentMonthlyCents": 4410,
        "features": {
          "inspections": 2,
          "oilCredits": 2,
          "tireRotations": 2,
          "priorityBooking": true,
          "detailCredits": 0
        }
      },
      "complete": {
        "name": "Complete",
        "monthlyCents": 7900,
        "discountPercent": 10,
        "annualCents": 85320,
        "savingsCents": 9480,
        "equivalentMonthlyCents": 7110,
        "features": {
          "inspections": 3,
          "oilCredits": 3,
          "tireRotations": 2,
          "priorityBooking": true,
          "detailCredits": 1
        }
      }
    }
  },
  "demo": {
    "stats": {
      "serviceCategories": 8,
      "processSteps": 4,
      "packageChoices": 3
    },
    "reviews": {
      "rating": 4.9,
      "count": 24,
      "scale": 5
    },
    "team": {
      "maya": {
        "name": "Maya Chen",
        "role": "Demo service lead"
      },
      "elias": {
        "name": "Elias Morgan",
        "role": "Demo diagnostic technician"
      },
      "jordan": {
        "name": "Jordan Patel",
        "role": "Demo client advisor"
      }
    },
    "certifications": {
      "inspection": {
        "label": "Inspection-first approach"
      },
      "ev": {
        "label": "EV-aware service planning"
      },
      "care": {
        "label": "Continuous learning"
      }
    }
  },
  "booking": {
    "mode": "demo",
    "minLeadDays": 1,
    "maxAdvanceDays": 90,
    "timeWindows": {
      "morning": "08:00–12:00",
      "afternoon": "12:00–18:00"
    },
    "retention": "memory-only"
  }
};
