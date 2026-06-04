import axios from "axios";

export async function reverseGeocode(lat, lon) {
  const localResponse = await axios.get(
    "https://nominatim.openstreetmap.org/reverse",
    {
      params: {
        format: "json",
        lat,
        lon,
        addressdetails: 1
      },
      headers: {
        "User-Agent": "DriveLegal"
      }
    }
  );

  const englishResponse = await axios.get(
    "https://nominatim.openstreetmap.org/reverse",
    {
      params: {
        format: "json",
        lat,
        lon,
        addressdetails: 1
      },
      headers: {
        "User-Agent": "DriveLegal",
        "Accept-Language": "en"
      }
    }
  );

  const local = localResponse.data.address;
  const english = englishResponse.data.address;

  return {
    country: {
      english: english.country || "",
      local: local.country || ""
    },

    city: {
      english:
        english.city ||
        english.town ||
        english.village ||
        "",
      local:
        local.city ||
        local.town ||
        local.village ||
        ""
    },

    state: {
      english: english.state || "",
      local: local.state || ""
    },

    displayName: {
      english: englishResponse.data.display_name,
      local: localResponse.data.display_name
    }
  };
}