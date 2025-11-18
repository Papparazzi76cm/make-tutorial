import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { createAudioBlob, base64ToUint8Array, pcmToAudioBuffer } from "../utils/audioUtils";
import { SYSTEM_INSTRUCTION } from "../constants";

export interface LiveClientEvents {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onVolumeChange?: (volume: number) => void; // 0 to 1, for visualizer
}

export class LiveClient {
  private ai: GoogleGenAI;
  private session: any = null; // Using any because connection promise type is complex
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextStartTime = 0;
  private audioSources = new Set<AudioBufferSourceNode>();
  private isActive = false;
  
  constructor(private events: LiveClientEvents) {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async connect() {
    if (this.isActive) return;

    try {
      // 1. Setup Audio Contexts
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // 2. Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 3. Connect to Gemini Live
      this.session = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: this.handleOpen.bind(this),
          onmessage: this.handleMessage.bind(this),
          onclose: this.handleClose.bind(this),
          onerror: this.handleError.bind(this),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: SYSTEM_INSTRUCTION + " Estás en modo de voz, sé conciso y directo.",
        },
      });

      // 4. Setup Input Processing (Microphone -> API)
      this.inputSource = this.inputAudioContext.createMediaStreamSource(stream);
      this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        if (!this.isActive) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calculate volume for visualizer
        let sum = 0;
        for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
        const rms = Math.sqrt(sum / inputData.length);
        this.events.onVolumeChange?.(Math.min(1, rms * 5)); // Boost a bit for visibility

        const pcmBlob = createAudioBlob(inputData);
        
        this.session.then((sess: any) => {
          sess.sendRealtimeInput({ media: pcmBlob });
        });
      };

      this.inputSource.connect(this.processor);
      this.processor.connect(this.inputAudioContext.destination);

      this.isActive = true;

    } catch (error: any) {
      this.handleError(new ErrorEvent('start_error', { message: error.message }));
    }
  }

  async disconnect() {
    if (!this.isActive) return;
    this.isActive = false;

    // Stop input
    if (this.inputSource) this.inputSource.disconnect();
    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
    }
    if (this.inputAudioContext) await this.inputAudioContext.close();

    // Stop output
    this.audioSources.forEach(source => source.stop());
    this.audioSources.clear();
    if (this.outputAudioContext) await this.outputAudioContext.close();

    // Close session - assumes session promise resolves to object with close()
    if (this.session) {
      // Not all session implementations have close immediately available if pending
      this.session.then((sess: any) => {
         // Note: The SDK might not expose an explicit close on the session object in all versions,
         // but cleaning up the client side contexts effectively ends the interaction.
         // We rely on onclose callback or garbage collection if close() isn't strictly typed.
      });
    }
    
    this.events.onDisconnect?.();
  }

  private handleOpen() {
    console.log("Live Session Opened");
    this.events.onConnect?.();
  }

  private async handleMessage(message: LiveServerMessage) {
    // Handle interruptions first
    // If the server signals an interruption, it means the user spoke while the model was speaking.
    // We must stop current playback immediately and discard any trailing audio in this message.
    if (message.serverContent?.interrupted) {
      console.log("Interrupted by user");
      this.audioSources.forEach(source => {
        try {
          source.stop();
        } catch (e) {
          // Ignore errors if source already stopped
        }
      });
      this.audioSources.clear();
      this.nextStartTime = 0;
      return;
    }

    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    
    if (base64Audio && this.outputAudioContext) {
      try {
        const pcmData = base64ToUint8Array(base64Audio);
        const audioBuffer = await pcmToAudioBuffer(pcmData, this.outputAudioContext);
        
        // Schedule playback
        this.nextStartTime = Math.max(this.outputAudioContext.currentTime, this.nextStartTime);
        
        const source = this.outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        const gainNode = this.outputAudioContext.createGain();
        // Slight volume boost for output if needed, or analysis
        gainNode.connect(this.outputAudioContext.destination);
        source.connect(gainNode);
        
        source.addEventListener('ended', () => {
          this.audioSources.delete(source);
        });

        source.start(this.nextStartTime);
        this.nextStartTime += audioBuffer.duration;
        this.audioSources.add(source);
      } catch (error) {
        console.error("Error processing audio chunk", error);
      }
    }

    // Note: We check turnComplete if needed, but for audio streaming, the loop is continuous.
  }

  private handleClose() {
    console.log("Live Session Closed");
    this.disconnect();
  }

  private handleError(e: ErrorEvent) {
    console.error("Live Session Error", e);
    this.events.onError?.(new Error(e.message || "Unknown error in Live API"));
    this.disconnect();
  }
}