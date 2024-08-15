import { supabase } from "../../utils/hooks/supabase";

const googleApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API;

export async function fetchAddress(lat, long) {
  const latlong = `${lat},${long}`;
  const requestOptions = {
    method: "GET",
  };

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latlong}&key=${googleApiKey}`,
      requestOptions
    );
    const result = await response.json();

    if (result.results && result.results.length > 0) {
      return result.results[0].formatted_address;
    } else {
      throw new Error("No results found");
    }
  } catch (error) {
    console.error("Error fetching address:", error);
    return "Error fetching address";
  }
}

export async function fetchDistance(originLat, originLong, destLat, destLong) {
  let origin = `${originLat},${originLong}`;
  let destination = `${destLat},${destLong}`;
  const requestOptions = {
    method: "GET",
  };
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${origin}&destinations=${destination}&key=${googleApiKey}`,
      requestOptions
    );
    const result = await response.json();

    if (
      result.rows &&
      result.rows.length > 0 &&
      result.rows[0].elements.length > 0
    ) {
      return [
        result.rows[0].elements[0].distance.text,
        result.rows[0].elements[0].duration.text,
      ];
    } else {
      throw new Error("No results found");
    }
  } catch (error) {
    console.error("Error fetching address:", error);
    return "Error fetching address";
  }
}

export async function insertData(
  currentPin,
  organization,
  pinDescription,
  selectedResourceType,
  pins,
  setPins,
  setLastAddedPinIndex,
  setCurrentPin,
  setSelectedResourceType
) {
  try {
    let currentTimestamp = new Date().toISOString();
    let lat = currentPin?.location.latitude;
    let long = currentPin?.location.longitude;
    let newPin = {
      title: organization,
      description: pinDescription,
      location: currentPin?.location,
      address: "string",
      deals: [],
      type: selectedResourceType,
      time: currentTimestamp,
    };
    const { data, error } = await supabase.from("pins").insert(newPin).select();
    if (error) {
      console.error("Error:", error);
    } else {
      setPins([...pins, data[0]]);
      setLastAddedPinIndex(pins.length);
      setCurrentPin(data[0]);
      setSelectedResourceType("");
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

export async function fetchData(setPins, setMarkets) {
  try {
    const { data, error } = await supabase.from("pins").select("*");
    if (error) {
      console.error("Error fetching data:", error);
    } else {
      setPins(data);
      setMarkets(data?.slice(0, 4));
      console.log(data?.slice(0, 4));
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

export async function addDeal(
  pin,
  deal,
  readDeals,
  CloseDealInfo,
  resetDealsStates
) {
  if (pin?.id) {
    const { data: currentPin, error: fetchError } = await supabase
      .from("pins")
      .select("deals")
      .eq("id", pin?.id)
      .single();

    if (fetchError) {
      console.error("Error fetching current pin data:", fetchError);
      return;
    }

    const { error: updateError } = await supabase
      .from("pins")
      .update({ deals: [...(currentPin.deals || []), deal] })
      .eq("id", pin?.id);

    if (updateError) {
      console.error("Error updating pin with new deal:", updateError);
      return;
    }

    await readDeals(pin);
    CloseDealInfo();
    resetDealsStates();
  }
}

export async function readDeals(pin, setPinDeals) {
  try {
    const { data, error } = await supabase
      .from("pins")
      .select("*")
      .eq("id", pin?.id);
    if (error) {
      console.error("Error fetching data:", error);
    } else {
      setPinDeals(data[0]?.deals);
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}
