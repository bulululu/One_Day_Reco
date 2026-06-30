import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MBTITheme, UserPreferences } from '@/types';

type PreferenceEditorSheetProps = {
  visible: boolean;
  theme: MBTITheme;
  preferences: UserPreferences | null;
  onClose: () => void;
  onSave: (preferences: UserPreferences) => void;
};

const SOCIAL_OPTIONS = ['大部分时间独处', '偶尔社交', '经常社交'];
const BUDGET_OPTIONS = ['0-50元', '50-150元', '150元以上'];
const COMMUTE_OPTIONS = ['15分钟以内', '30分钟以内', '45分钟以内'];
const ACTIVITY_TYPES = ['户外探索', '文化艺术', '运动健身', '手工 DIY', '美食饮品', '电影内容', '游戏'];

function hexToRgba(hex: string, opacity: number) {
  const clean = hex.replace('#', '');
  const value = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean;
  const int = parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${opacity})`;
}

function selectedTypesFromNotes(notes?: string) {
  const match = notes?.match(/activityTypes=([^；]+)/);
  if (!match?.[1]) return ['户外探索', '电影内容'];
  return match[1].split(',').filter(Boolean);
}

function buildNotes(baseNotes: string, selectedTypes: string[]) {
  const rest = baseNotes
    .split('；')
    .filter((item) => item && !item.startsWith('activityTypes='))
    .join('；');
  return [`activityTypes=${selectedTypes.join(',')}`, rest].filter(Boolean).join('；');
}

function toggleType(items: string[], item: string) {
  if (items.includes(item)) return items.filter((value) => value !== item);
  return [...items, item].slice(0, 6);
}

export function PreferenceEditorSheet({
  visible,
  theme,
  preferences,
  onClose,
  onSave,
}: PreferenceEditorSheetProps) {
  const colors = theme.colors;
  const [social, setSocial] = useState(preferences?.social_frequency || SOCIAL_OPTIONS[1]);
  const [budget, setBudget] = useState(preferences?.budget || BUDGET_OPTIONS[1]);
  const [commute, setCommute] = useState(preferences?.commute_tolerance || COMMUTE_OPTIONS[1]);
  const [types, setTypes] = useState<string[]>(selectedTypesFromNotes(preferences?.notes));

  useEffect(() => {
    if (!visible) return;
    setSocial(preferences?.social_frequency || SOCIAL_OPTIONS[1]);
    setBudget(preferences?.budget || BUDGET_OPTIONS[1]);
    setCommute(preferences?.commute_tolerance || COMMUTE_OPTIONS[1]);
    setTypes(selectedTypesFromNotes(preferences?.notes));
  }, [visible, preferences]);

  const handleSave = () => {
    onSave({
      social_frequency: social,
      budget,
      commute_tolerance: commute,
      notes: buildNotes(preferences?.notes || '', types),
    });
    onClose();
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: hexToRgba(colors.accent, 0.14),
              shadowColor: colors.accent,
            },
          ]}
        >
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>偏好管理</Text>
              <Text style={[styles.subtitle, { color: colors.subtext }]}>更新后会影响下一次推荐</Text>
            </View>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: hexToRgba(colors.accent, 0.08) }]}>
              <Text style={[styles.closeText, { color: colors.accent }]}>×</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <OptionGroup colors={colors} title="社交偏好" options={SOCIAL_OPTIONS} value={social} onChange={setSocial} />
            <OptionGroup colors={colors} title="预算范围" options={BUDGET_OPTIONS} value={budget} onChange={setBudget} />
            <OptionGroup colors={colors} title="通勤容忍度" options={COMMUTE_OPTIONS} value={commute} onChange={setCommute} />

            <Text style={[styles.groupTitle, { color: colors.text }]}>活动类型</Text>
            <View style={styles.typeGrid}>
              {ACTIVITY_TYPES.map((item) => {
                const selected = types.includes(item);
                return (
                  <Pressable
                    key={item}
                    onPress={() => setTypes((current) => toggleType(current, item))}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: selected ? colors.accent : hexToRgba(colors.accent, 0.07),
                        borderColor: selected ? colors.accent : hexToRgba(colors.accent, 0.14),
                      },
                    ]}
                  >
                    <Text style={[styles.typeText, { color: selected ? '#fff' : colors.text }]}>{item}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={handleSave}>
              <Text style={styles.saveText}>保存偏好</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function OptionGroup({
  colors,
  title,
  options,
  value,
  onChange,
}: {
  colors: { accent: string; text: string; subtext: string };
  title: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.optionRow}>
        {options.map((option) => {
          const selected = value === option;
          return (
            <Pressable
              key={option}
              style={[
                styles.option,
                {
                  backgroundColor: selected ? colors.accent : hexToRgba(colors.accent, 0.07),
                  borderColor: selected ? colors.accent : hexToRgba(colors.accent, 0.14),
                },
              ]}
              onPress={() => onChange(option)}
            >
              <Text style={[styles.optionText, { color: selected ? '#fff' : colors.subtext }]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(32,28,24,0.26)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '86%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    padding: 18,
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: -8 },
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 23,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 5,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 28,
    lineHeight: 30,
  },
  group: {
    marginBottom: 17,
  },
  groupTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    minHeight: 42,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 18,
  },
  typeChip: {
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '900',
  },
  saveBtn: {
    height: 54,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  saveText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
  },
});
