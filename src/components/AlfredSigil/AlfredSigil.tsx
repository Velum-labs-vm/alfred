import React from 'react';
import {View, StyleSheet} from 'react-native';
import Svg, {Defs, RadialGradient, Stop, Circle, Path} from 'react-native-svg';

type Props = {size?: number; glow?: string};

export const AlfredSigil: React.FC<Props> = ({size = 220, glow = '#8f7440'}) => {
  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Defs>
          <RadialGradient id="orb" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#1d2230" stopOpacity="1" />
            <Stop offset="100%" stopColor="#080a10" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Circle cx="100" cy="100" r="88" fill="url(#orb)" stroke={glow} strokeOpacity="0.42" strokeWidth="2" />
        <Path
          d="M30 112 C45 88, 72 83, 90 95 C96 80, 104 80, 110 95 C128 83, 155 88, 170 112 C153 106, 136 108, 120 116 C112 120, 88 120, 80 116 C64 108, 47 106, 30 112 Z"
          fill={glow}
          fillOpacity="0.86"
        />
        <Path d="M88 95 L100 70 L112 95" fill={glow} fillOpacity="0.68" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {alignItems: 'center', justifyContent: 'center'},
});
