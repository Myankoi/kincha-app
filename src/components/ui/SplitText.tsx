import React from 'react';
import { motion } from 'framer-motion';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number; // delay in ms between characters/words
  duration?: number; // duration of animation for each
  ease?: any;
  splitType?: 'chars' | 'words';
  from?: any;
  to?: any;
  threshold?: number;
  rootMargin?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  textAlign?: React.CSSProperties['textAlign'];
}

export const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 30,
  duration = 0.5,
  ease = [0.2, 0.65, 0.3, 0.9],
  splitType = 'chars',
  from = { opacity: 0, y: 20 },
  to = { opacity: 1, y: 0 },
  tag = 'p',
  textAlign = 'center',
}) => {
  const items = splitType === 'chars' ? text.split('') : text.split(' ');
  const Tag = motion[tag] as any;

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: delay / 1000,
      },
    },
  };

  const itemVariants = {
    hidden: from,
    visible: {
      ...to,
      transition: {
        duration: duration,
        ease: ease,
      },
    },
  };

  return (
    <Tag
      className={`inline-block whitespace-normal ${className}`}
      style={{ textAlign, display: 'inline-block' }}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
    >
      {items.map((item, idx) => (
        <motion.span
          key={idx}
          className="inline-block"
          variants={itemVariants}
          style={{ whiteSpace: 'pre' }}
        >
          {item}
          {splitType === 'words' && idx < items.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </Tag>
  );
};

export default SplitText;
