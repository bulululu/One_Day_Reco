import * as Location from 'expo-location';

export type CurrentLocation = {
  label: string;
  latitude: number;
  longitude: number;
};

function formatAddress(place?: Location.LocationGeocodedAddress) {
  if (!place) return '';
  return [
    place.city || place.region,
    place.district,
    place.street,
  ].filter(Boolean).join(' ');
}

export async function getCurrentLocation(): Promise<CurrentLocation | null> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) return null;

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const { latitude, longitude } = position.coords;
  let label = '';
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    label = formatAddress(place);
  } catch {
    label = '';
  }

  return {
    label: label || `${latitude.toFixed(5)},${longitude.toFixed(5)}`,
    latitude,
    longitude,
  };
}
