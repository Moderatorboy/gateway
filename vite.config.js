import { defineConfig } from 'vite';
import JavaScriptObfuscator from 'javascript-obfuscator';

function obfuscatorPlugin() {
  return {
    name: 'vite-plugin-obfuscator',
    enforce: 'post',
    apply: 'build',
    generateBundle(options, bundle) {
      for (const [fileName, file] of Object.entries(bundle)) {
        if (file.type === 'chunk' && fileName.endsWith('.js')) {
          console.log(`Obfuscating chunk: ${fileName}`);
          const obfuscationResult = JavaScriptObfuscator.obfuscate(file.code, {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            deadCodeInjection: true,
            deadCodeInjectionThreshold: 0.4,
            debugProtection: false,
            disableConsoleOutput: false,
            identifierNamesGenerator: 'hexadecimal',
            log: false,
            numbersToExpressions: true,
            renameGlobals: false,
            selfDefending: true,
            simplify: true,
            splitStrings: true,
            splitStringsChunkLength: 10,
            stringArray: true,
            stringArrayCallsTransform: true,
            stringArrayEncoding: ['rc4'],
            stringArrayIndexShift: true,
            stringArrayRotate: true,
            stringArrayShuffle: true,
            stringArrayWrappersCount: 2,
            stringArrayWrappersChainedCalls: true,
            stringArrayWrappersType: 'variable',
            stringArrayThreshold: 0.75,
            unicodeEscapeSequence: false
          });
          file.code = obfuscationResult.getObfuscatedCode();
        }
      }
    }
  };
}

export default defineConfig({
  plugins: [obfuscatorPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        pdf: './pdf.html'
      }
    }
  }
});
