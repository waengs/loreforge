import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  Alert,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import CharacterActionRow from '../../components/characters/CharacterActionRow';
import CharacterFormModal from '../../components/characters/CharacterFormModal';
import CharacterGrid from '../../components/characters/CharacterGrid';
import ImportCharacterModal from '../../components/characters/ImportCharacterModal';
import RelationshipFormModal from '../../components/characters/RelationshipFormModal';
import RelationshipGraph from '../../components/characters/RelationshipGraph';
import SectionTitle from '../../components/characters/SectionTitle';
import ScreenLayout from '../../components/ScreenLayout';
import { exportRelationshipGraphPdf } from '../../services/exportRelationshipGraphPdf';
import { relationshipLabel } from '../../constants/relationships';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import {
  selectActiveWorldName,
  selectCharacters,
  selectRelationships,
} from '../../store/selectors';
import { useLoreStore } from '../../store/useLoreStore';

const GRAPH_WIDTH = Dimensions.get('window').width - spacing.md * 2;

export default function CharactersScreen() {
  const { edit, new: isNew } = useLocalSearchParams();
  const characters = useLoreStore(selectCharacters);
  const relationships = useLoreStore(selectRelationships);
  const worldName = useLoreStore(selectActiveWorldName);
  const addCharacter = useLoreStore((s) => s.addCharacter);
  const updateCharacter = useLoreStore((s) => s.updateCharacter);
  const deleteCharacter = useLoreStore((s) => s.deleteCharacter);
  const importCharactersFromWorld = useLoreStore(
    (s) => s.importCharactersFromWorld
  );
  const addRelationship = useLoreStore((s) => s.addRelationship);
  const updateRelationship = useLoreStore((s) => s.updateRelationship);
  const deleteRelationship = useLoreStore((s) => s.deleteRelationship);
  const getCharacterById = useLoreStore((s) => s.getCharacterById);

  const [importOpen, setImportOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [relOpen, setRelOpen] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState(null);
  const [editingCharacter, setEditingCharacter] = useState(null);
  const handledParams = useRef('');

  const openNew = () => {
    setEditingCharacter(null);
    setFormOpen(true);
  };

  const openEdit = (character) => {
    setEditingCharacter(character);
    setFormOpen(true);
  };

  useEffect(() => {
    const key = `${edit || ''}-${isNew || ''}`;
    if (handledParams.current === key) return;
    if (edit && typeof edit === 'string') {
      const c = characters.find((ch) => ch.id === edit);
      if (c) {
        handledParams.current = key;
        openEdit(c);
      }
    } else if (isNew === '1') {
      handledParams.current = key;
      openNew();
    }
  }, [edit, isNew, characters]);

  const handleSaveCharacter = (form) => {
    if (editingCharacter) {
      updateCharacter(editingCharacter.id, form);
    } else {
      addCharacter(form);
    }
    setFormOpen(false);
    setEditingCharacter(null);
  };

  const handleDeleteCharacter = () => {
    if (!editingCharacter) return;
    Alert.alert('Delete character', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteCharacter(editingCharacter.id);
          setFormOpen(false);
          setEditingCharacter(null);
        },
      },
    ]);
  };

  const handleImport = (sourceWorldId, characterIds) => {
    const count = importCharactersFromWorld(sourceWorldId, characterIds);
    if (count) {
      Alert.alert('Imported', `${count} character(s) added to this world.`);
    }
  };

  const handleSaveRelationship = (form) => {
    if (editingRelationship) {
      updateRelationship(editingRelationship.id, form);
    } else {
      addRelationship(form);
    }
    setEditingRelationship(null);
  };

  const openNewRelationship = () => {
    setEditingRelationship(null);
    setRelOpen(true);
  };

  const openEditRelationship = (rel) => {
    setEditingRelationship(rel);
    setRelOpen(true);
  };

  const exportGraph = async () => {
    try {
      await exportRelationshipGraphPdf({
        worldName,
        characters,
        relationships,
        getCharacterById,
      });
    } catch (err) {
      Alert.alert(
        'Export failed',
        err?.message || 'Could not create the PDF.'
      );
    }
  };

  const name = (id) => getCharacterById(id)?.name || '?';

  return (
    <ScreenLayout showSettings>
      <SectionTitle icon="account-group" title="Characters" />
      <CharacterActionRow
        onImport={() => setImportOpen(true)}
        onAddNew={openNew}
      />
      <CharacterGrid characters={characters} onPressCharacter={openEdit} />

      <SectionTitle icon="graph" title="Relationships" />
      <TouchableOpacity
        style={styles.addRelOuter}
        onPress={openNewRelationship}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[colors.cardGradientStart, colors.cardGradientEnd]}
          style={styles.addRelBtn}
        >
          <MaterialCommunityIcons name="plus" size={18} color={colors.text} />
          <Text style={styles.addRelText}>ADD NEW RELATIONSHIP</Text>
        </LinearGradient>
      </TouchableOpacity>

      <RelationshipGraph
        characters={characters}
        relationships={relationships}
        width={GRAPH_WIDTH}
      />

      <TouchableOpacity style={styles.exportBtn} onPress={exportGraph}>
        <MaterialCommunityIcons
          name="export-variant"
          size={16}
          color={colors.gold}
        />
        <Text style={styles.exportText}>Export PDF</Text>
      </TouchableOpacity>

      {relationships.length > 0 ? (
        <View style={styles.relList}>
          {relationships.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={styles.relCard}
              onPress={() => openEditRelationship(r)}
              activeOpacity={0.85}
            >
              <View style={styles.relBody}>
                <Text style={styles.relTitle}>
                  {name(r.charAId)} ↔ {name(r.charBId)}
                </Text>
                <Text style={styles.relDetail}>
                  {name(r.charAId)} → {name(r.charBId)}:{' '}
                  {relationshipLabel(r.dynamicAToB)}
                </Text>
                <Text style={styles.relDetail}>
                  {name(r.charBId)} → {name(r.charAId)}:{' '}
                  {relationshipLabel(r.dynamicBToA)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => deleteRelationship(r.id)}
                hitSlop={8}
              >
                <MaterialCommunityIcons
                  name="delete-outline"
                  size={20}
                  color={colors.error}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <ImportCharacterModal
        visible={importOpen}
        onDismiss={() => setImportOpen(false)}
        onImport={handleImport}
      />

      <CharacterFormModal
        visible={formOpen}
        editingCharacter={editingCharacter}
        onDismiss={() => {
          setFormOpen(false);
          setEditingCharacter(null);
        }}
        onSave={handleSaveCharacter}
        onDelete={handleDeleteCharacter}
      />

      <RelationshipFormModal
        visible={relOpen}
        characters={characters}
        editingRelationship={editingRelationship}
        onDismiss={() => {
          setRelOpen(false);
          setEditingRelationship(null);
        }}
        onSave={handleSaveRelationship}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  addRelOuter: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  addRelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  addRelText: {
    fontFamily: fonts.serif,
    color: colors.text,
    fontSize: 12,
    letterSpacing: 1,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
  },
  exportText: {
    fontFamily: fonts.bodySemi,
    color: colors.gold,
    fontSize: 13,
  },
  relList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  relCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    gap: spacing.sm,
  },
  relBody: {
    flex: 1,
  },
  relTitle: {
    fontFamily: fonts.serifBold,
    color: colors.text,
    fontSize: 14,
    marginBottom: 4,
  },
  relDetail: {
    fontFamily: fonts.body,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
