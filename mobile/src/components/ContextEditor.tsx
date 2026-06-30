import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MBTITheme } from '@/types';

type ContextEditorProps = {
  theme: MBTITheme;
  location: string;
  weather: string;
  expanded: boolean;
  isWeatherLoading: boolean;
  weatherOptions: readonly string[];
  onToggle: () => void;
  onLocationChange: (value: string) => void;
  onWeatherChange: (value: string) => void;
  onRefresh: () => void;
  onFetchWeather: () => void;
};

function hexToRgba(hex: string, opacity: number) {
  const clean = hex.replace('#', '');
  const value = clean.length === 3
    ? clean.split('').map((char) => char + char).join('')
    : clean;
  const int = parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${opacity})`;
}

export function ContextEditor({
  theme,
  location,
  weather,
  expanded,
  isWeatherLoading,
  weatherOptions,
  onToggle,
  onLocationChange,
  onWeatherChange,
  onRefresh,
  onFetchWeather,
}: ContextEditorProps) {
  const colors = theme.colors;
  const locationLabel = location || '当前位置';

  return (
    <View
      style={[
        styles.editor,
        {
          backgroundColor: colors.card,
          borderColor: hexToRgba(colors.accent, 0.14),
        },
      ]}
    >
      <Pressable style={styles.summary} onPress={onToggle}>
        <View>
          <Text style={[styles.label, { color: colors.subtext }]}>当前情况</Text>
          <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
            {locationLabel} · {weather}
          </Text>
        </View>
        <Text style={[styles.toggle, { color: colors.accent }]}>
          {expanded ? '收起' : '调整'}
        </Text>
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          <TextInput
            style={[
              styles.locationInput,
              {
                color: colors.text,
                borderColor: hexToRgba(colors.accent, 0.18),
                backgroundColor: hexToRgba(colors.accent, 0.06),
              },
            ]}
            value={location}
            onChangeText={onLocationChange}
            placeholder="输入城市、商圈或附近位置"
            placeholderTextColor={colors.subtext}
            maxLength={40}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weatherList}
          >
            {weatherOptions.map((item) => {
              const selected = weather === item;
              return (
                <Pressable
                  key={item}
                  style={[
                    styles.weatherChip,
                    {
                      backgroundColor: selected ? colors.accent : hexToRgba(colors.accent, 0.08),
                      borderColor: selected ? colors.accent : hexToRgba(colors.accent, 0.18),
                    },
                  ]}
                  onPress={() => onWeatherChange(item)}
                >
                  <Text style={[styles.weatherChipText, { color: selected ? '#fff' : colors.accent }]}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable style={[styles.refresh, { backgroundColor: colors.accent }]} onPress={onRefresh}>
            <Text style={styles.refreshText}>按当前情况刷新</Text>
          </Pressable>
          <Pressable
            style={[
              styles.weatherFetch,
              {
                borderColor: hexToRgba(colors.accent, 0.22),
                backgroundColor: hexToRgba(colors.accent, 0.06),
              },
            ]}
            onPress={onFetchWeather}
            disabled={isWeatherLoading}
          >
            <Text style={[styles.weatherFetchText, { color: colors.accent }]}>
              {isWeatherLoading ? '获取中...' : '获取实时天气'}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  editor: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    marginBottom: 18,
  },
  summary: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  toggle: {
    fontSize: 14,
    fontWeight: '800',
  },
  body: {
    paddingTop: 14,
    gap: 12,
  },
  locationInput: {
    minHeight: 44,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '700',
  },
  weatherList: {
    gap: 8,
  },
  weatherChip: {
    minHeight: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  weatherChipText: {
    fontSize: 14,
    fontWeight: '800',
  },
  refresh: {
    minHeight: 44,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  weatherFetch: {
    minHeight: 40,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherFetchText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
