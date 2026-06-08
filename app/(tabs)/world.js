import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeHeader from '../../components/home/HomeHeader';
import WorldSwitcher from '../../components/WorldSwitcher';
import CategoryFilterRow from '../../components/world/CategoryFilterRow';
import PlotCard from '../../components/world/PlotCard';
import PlotFormModal from '../../components/world/PlotFormModal';
import RuleCard from '../../components/world/RuleCard';
import RuleFormModal from '../../components/world/RuleFormModal';
import WorldTabBar from '../../components/world/WorldTabBar';
import { colors, fonts, spacing } from '../../constants/theme';
import { useLoreStore } from '../../store/useLoreStore';
import {
  selectCharacters,
  selectPlotSeeds,
  selectWorldRules,
} from '../../store/selectors';

const TABS = ['Rules', 'Plots'];

export default function WorldScreen() {
  const { tab, new: isNew } = useLocalSearchParams();
  const worldRules = useLoreStore(selectWorldRules);
  const plotSeeds = useLoreStore(selectPlotSeeds);
  const characters = useLoreStore(selectCharacters);
  const addWorldRule = useLoreStore((s) => s.addWorldRule);
  const updateWorldRule = useLoreStore((s) => s.updateWorldRule);
  const deleteWorldRule = useLoreStore((s) => s.deleteWorldRule);
  const addPlotSeed = useLoreStore((s) => s.addPlotSeed);
  const updatePlotSeed = useLoreStore((s) => s.updatePlotSeed);
  const deletePlotSeed = useLoreStore((s) => s.deletePlotSeed);

  const [activeTab, setActiveTab] = useState('Rules');
  const [filter, setFilter] = useState('all');
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [plotModalOpen, setPlotModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [editingPlot, setEditingPlot] = useState(null);
  const handledNewParam = useRef('');

  useEffect(() => {
    if (tab && TABS.includes(String(tab))) {
      setActiveTab(String(tab));
    }
  }, [tab]);

  const filteredRules = useMemo(() => {
    if (filter === 'all') return worldRules;
    return worldRules.filter((r) => r.category === filter);
  }, [worldRules, filter]);

  const openNewRule = () => {
    setEditingRule(null);
    setRuleModalOpen(true);
  };

  const openEditRule = (rule) => {
    setEditingRule(rule);
    setRuleModalOpen(true);
  };

  const openNewPlot = () => {
    setEditingPlot(null);
    setPlotModalOpen(true);
  };

  const openEditPlot = (plot) => {
    setEditingPlot(plot);
    setPlotModalOpen(true);
  };

  useEffect(() => {
    const key = `${tab || ''}-${isNew || ''}`;
    if (isNew !== '1' || handledNewParam.current === key) return;
    handledNewParam.current = key;
    if (String(tab) === 'Plots') {
      openNewPlot();
    } else {
      openNewRule();
    }
  }, [isNew, tab]);

  const confirmDeleteRule = (id) => {
    Alert.alert('Delete rule', 'Remove this world rule?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteWorldRule(id),
      },
    ]);
  };

  const confirmDeletePlot = (id) => {
    Alert.alert('Delete plot', 'Remove this plot seed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deletePlotSeed(id),
      },
    ]);
  };

  const saveRule = (data) => {
    if (editingRule) {
      updateWorldRule(editingRule.id, data);
    } else {
      addWorldRule(data);
    }
    setRuleModalOpen(false);
    setEditingRule(null);
  };

  const savePlot = (data) => {
    if (editingPlot) {
      updatePlotSeed(editingPlot.id, data);
    } else {
      addPlotSeed(data);
    }
    setPlotModalOpen(false);
    setEditingPlot(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <HomeHeader />
      <WorldSwitcher />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <WorldTabBar active={activeTab} onChange={setActiveTab} />

        {activeTab === 'Rules' ? (
          <>
            <CategoryFilterRow active={filter} onChange={setFilter} />

            <TouchableOpacity style={styles.addBtn} onPress={openNewRule}>
              <MaterialCommunityIcons name="plus" size={16} color={colors.gold} />
              <Text style={styles.addBtnText}>add rule</Text>
            </TouchableOpacity>

            {filteredRules.length === 0 ? (
              <Text style={styles.empty}>
                No rules yet, add lore that shapes your world.
              </Text>
            ) : (
              filteredRules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  characters={characters}
                  onPress={() => openEditRule(rule)}
                  onDelete={() => confirmDeleteRule(rule.id)}
                />
              ))
            )}
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={openNewPlot}>
              <MaterialCommunityIcons name="plus" size={16} color={colors.gold} />
              <Text style={styles.addBtnText}>add plot</Text>
            </TouchableOpacity>

            {plotSeeds.length === 0 ? (
              <Text style={styles.empty}>
                No plot seeds yet, plant a story idea to grow later.
              </Text>
            ) : (
              plotSeeds.map((plot) => (
                <PlotCard
                  key={plot.id}
                  plot={plot}
                  onPress={() => openEditPlot(plot)}
                  onDelete={() => confirmDeletePlot(plot.id)}
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      <RuleFormModal
        visible={ruleModalOpen}
        editingRule={editingRule}
        characters={characters}
        onDismiss={() => {
          setRuleModalOpen(false);
          setEditingRule(null);
        }}
        onSave={saveRule}
        onDelete={() => {
          if (editingRule) {
            confirmDeleteRule(editingRule.id);
            setRuleModalOpen(false);
            setEditingRule(null);
          }
        }}
      />

      <PlotFormModal
        visible={plotModalOpen}
        editingPlot={editingPlot}
        onDismiss={() => {
          setPlotModalOpen(false);
          setEditingPlot(null);
        }}
        onSave={savePlot}
        onDelete={() => {
          if (editingPlot) {
            confirmDeletePlot(editingPlot.id);
            setPlotModalOpen(false);
            setEditingPlot(null);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  addBtnText: {
    fontFamily: fonts.bodySemi,
    color: colors.gold,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  empty: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
});
