import { Box, Text, VStack } from '@chakra-ui/react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { SlashCommand } from '@/config/slash-commands';

export type SlashAssistUi = {
  recognized: SlashCommand | null;
  menuOpen: boolean;
  items: SlashCommand[];
  highlightIndex: number;
  onItemHover: (index: number) => void;
  onPickItem: (cmd: SlashCommand) => void;
};

type SlashCommandUiProps = {
  assist: SlashAssistUi;
  compact?: boolean;
};

export const SlashCommandUi = memo(({ assist, compact }: SlashCommandUiProps) => {
  const { t } = useTranslation();
  const {
    recognized,
    menuOpen,
    items,
    highlightIndex,
    onItemHover,
    onPickItem,
  } = assist;

  if (!recognized && !(menuOpen && items.length > 0)) {
    return null;
  }

  const badgeTop = compact ? '4px' : '6px';
  const badgeLeft = compact ? '10px' : '48px';
  const badgeRight = compact ? '10px' : '12px';
  const menuTop = compact ? '22px' : '28px';
  const menuLeft = compact ? '8px' : '12px';
  const menuRight = compact ? '8px' : '12px';

  return (
    <>
      {recognized && (
        <Box
          position="absolute"
          top={badgeTop}
          left={badgeLeft}
          right={badgeRight}
          zIndex={5}
          pointerEvents="none"
        >
          <Box
            as="span"
            display="inline-block"
            fontSize="xs"
            fontWeight="semibold"
            px="2"
            py="0.5"
            borderRadius="md"
            bg="cyan.900"
            color="cyan.100"
            borderWidth="1px"
            borderColor="cyan.700"
          >
            {t('footer.slashCommandMode', { command: recognized.label })}
          </Box>
        </Box>
      )}
      {menuOpen && items.length > 0 && (
        <Box
          position="absolute"
          left={menuLeft}
          right={menuRight}
          top={menuTop}
          zIndex={20}
          bg="gray.900"
          borderWidth="1px"
          borderColor="whiteAlpha.300"
          borderRadius="md"
          boxShadow="lg"
          maxH="140px"
          overflowY="auto"
        >
          <VStack gap="0" align="stretch" p="1">
            {items.map((cmd, i) => (
              <Box
                key={cmd.id}
                px="3"
                py="2"
                borderRadius="md"
                cursor="pointer"
                bg={i === highlightIndex ? 'whiteAlpha.200' : 'transparent'}
                _hover={{ bg: 'whiteAlpha.150' }}
                onMouseEnter={() => onItemHover(i)}
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => onPickItem(cmd)}
              >
                <Text fontWeight="semibold" fontSize="sm" color="whiteAlpha.950">
                  /
                  {cmd.id}
                </Text>
                <Text fontSize="xs" color="whiteAlpha.600">
                  {cmd.description}
                </Text>
              </Box>
            ))}
          </VStack>
        </Box>
      )}
    </>
  );
});

SlashCommandUi.displayName = 'SlashCommandUi';
