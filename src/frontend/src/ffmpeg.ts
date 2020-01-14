import * as Ffmpeg from 'fluent-ffmpeg'
import { Readable } from 'stream'
import { PlayerError, PlayerErrors } from './playerError'

function appendCmdWithoutSubtitle(ffmpegCmd: Ffmpeg.FfmpegCommand, videoStream: number, inputVideoCodec: string, audioStream: number): void {
  if (process.platform === 'darwin') {
    ffmpegCmd.videoCodec('libx264')
  } else {
    ffmpegCmd.videoCodec(inputVideoCodec === 'h264' ? 'copy' : 'libx264')
  }

  if (audioStream && audioStream > -1) {
    ffmpegCmd.outputOptions([`-map 0:${videoStream}`, `-map 0:${audioStream}?`])
  } else {
    ffmpegCmd
        .input('anullsrc')
        .inputFormat('lavfi')

  }
}

function appendCmdWithSubtitle(ffmpegCmd: Ffmpeg.FfmpegCommand, audioStream: number, subtitleStream: number): void {
  // TODO: how to add yadif to -filter_complex ? Currently, we don't find a way to do interlacing + subtitles
  const filterComplex: string = `-filter_complex [0:v][0:${subtitleStream}]overlay[v]`
  ffmpegCmd.outputOptions([filterComplex, '-map [v]', `-map 0:${audioStream}?`])
}

function handleError(callback: (error: PlayerError) => void): (err: Error, stdout: string, stderr: string | undefined) => void {
  return (err, stdout, stderr) => {
    const message = `_________err ${new Date()}: ${err}, ${stdout} ${stderr}`

    let playerError: PlayerErrors
    if (message.includes('Conversion failed')) {
      playerError = PlayerErrors.CONVERSION
    } else if (message.includes('Stream specifier')) {
      playerError = PlayerErrors.ERRONEOUS_STREAM
    } else if (message.includes('ffmpeg was killed with signal') || message.includes('ffmpeg exited with code')) {
      playerError = PlayerErrors.TERMINATED
    } else {
      playerError = PlayerErrors.UNKNOWN
    }
    callback(new PlayerError(message, playerError))
  }
}

export function getVideoMpegtsPipeline(
    input: string | Readable,
    videoStream: number,
    audioStream: number = -1,
    subtitleStream: number = -1,
    inputVideoCodec: string,
    isDeinterlacingEnabled: boolean,
    errorHandler: (error: PlayerError) => void,
  ): Ffmpeg.FfmpegCommand {
  if (process.platform === 'darwin' && !(input instanceof Readable)) {
    input += '?fifo_size=13160&overrun_nonfatal=1&buffer_size=/18800&pkt_size=188'
  }

  const ffmpegCmd = Ffmpeg(input)
    .inputOptions('-probesize 700k')
    .outputOptions('-preset ultrafast')
    .outputOptions('-g 30')
    .outputOptions('-tune zerolatency')

  if (subtitleStream && subtitleStream > -1) {
    console.log('-------- appendCmdWithSubtitle')
    appendCmdWithSubtitle(ffmpegCmd, audioStream, subtitleStream)
  } else {
    console.log('-------- appendCmdWithoutSubtitle')
    appendCmdWithoutSubtitle(ffmpegCmd, videoStream, inputVideoCodec, audioStream)
  }

  if (isDeinterlacingEnabled && !(subtitleStream && subtitleStream > -1)) {
    // force deinterlacing
    ffmpegCmd.videoCodec('libx264')
    ffmpegCmd.videoFilters('yadif')
  }

  if (process.platform === 'darwin' && !(subtitleStream && subtitleStream > -1)) {
    ffmpegCmd.videoFilters('yadif') // force deinterlacing
    // is MAC, no need to flush packets
  }  else if (process.platform !== 'darwin') {
    ffmpegCmd.outputOptions('-flush_packets -1')
  }

  return ffmpegCmd
    .format('mp4')
    .outputOptions('-movflags empty_moov+omit_tfhd_offset+frag_keyframe+default_base_moof')
    .on('start', (commandLine) => {
      console.log('Spawned Ffmpeg with command: ', commandLine)
    })
    .on('error', handleError(errorHandler))
}

export function getAudioMpegtsPipeline(
    input: string | Readable,
    errorHandler: (error: PlayerError) => void,
  ): Ffmpeg.FfmpegCommand {
  console.log('run url: ', input)

  return Ffmpeg(input)
    .format('mp3')
    .on('start', commandLine => {
      console.log('Spawned Ffmpeg with command:', commandLine)
    })
    .on('error', handleError(errorHandler))
}
