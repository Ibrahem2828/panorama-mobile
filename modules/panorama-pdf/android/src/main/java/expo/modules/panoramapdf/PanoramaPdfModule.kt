package expo.modules.panoramapdf

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream

/**
 * Renders pages of a PDF that lives in the app's private storage to PNG files in the app's private cache, using the platform's
 * own PdfRenderer. Nothing is written outside the paths the caller passes (which are always app-private), and nothing is shared.
 */
class PanoramaPdfModule : Module() {
  private fun toPath(uri: String): String = if (uri.startsWith("file://")) uri.removePrefix("file://") else uri

  override fun definition() = ModuleDefinition {
    Name("PanoramaPdf")

    AsyncFunction("getPageCount") { uri: String ->
      val pfd = ParcelFileDescriptor.open(File(toPath(uri)), ParcelFileDescriptor.MODE_READ_ONLY)
      try {
        PdfRenderer(pfd).use { it.pageCount }
      } catch (e: SecurityException) {
        throw CodedException("ERR_PDF_PROTECTED", "The PDF is password protected", e)
      } catch (e: Exception) {
        throw CodedException("ERR_PDF_INVALID", "The PDF cannot be read", e)
      } finally {
        pfd.close()
      }
    }

    AsyncFunction("renderPage") { uri: String, index: Int, width: Int, outUri: String ->
      val pfd = ParcelFileDescriptor.open(File(toPath(uri)), ParcelFileDescriptor.MODE_READ_ONLY)
      try {
        PdfRenderer(pfd).use { renderer ->
          renderer.openPage(index).use { page ->
            val targetWidth = width.coerceIn(200, 2400)
            val targetHeight = (targetWidth.toFloat() * page.height / page.width).toInt().coerceAtLeast(1)
            val bitmap = Bitmap.createBitmap(targetWidth, targetHeight, Bitmap.Config.ARGB_8888)
            // PdfRenderer draws onto a transparent bitmap; paint the paper white first.
            Canvas(bitmap).drawColor(Color.WHITE)
            page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
            val out = File(toPath(outUri))
            out.parentFile?.mkdirs()
            FileOutputStream(out).use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
            bitmap.recycle()
            mapOf("width" to targetWidth, "height" to targetHeight)
          }
        }
      } catch (e: SecurityException) {
        throw CodedException("ERR_PDF_PROTECTED", "The PDF is password protected", e)
      } catch (e: Exception) {
        throw CodedException("ERR_PDF_INVALID", "The PDF page cannot be rendered", e)
      } finally {
        pfd.close()
      }
    }
  }
}
