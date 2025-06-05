package main

import (
	"path/filepath"
	"net/http"
	"net/http/httputil"
	"bufio"
	"mime"
	"os"

	"github.com/rs/xid"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	e := echo.New()

	e.Use(middleware.Logger())

	e.POST("/deaddrop", func(c echo.Context) error {

		id := xid.New().String()
		savePath := filepath.Join("/tmp", id)

		outFile, err := os.Create(savePath)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "保存ファイルの作成に失敗しました: "+err.Error())
		}
		defer outFile.Close()

		dump, err := httputil.DumpRequest(c.Request(), true)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "リクエストのダンプに失敗しました: "+err.Error())
		}
		if _, err := outFile.Write(dump); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "ファイル保存中にエラー: "+err.Error())
		}

		return c.JSON(http.StatusOK, echo.Map{"id": id})
	})

	e.GET("/deaddrop/:id", func(c echo.Context) error {
		id := c.Param("id")
		filePath := filepath.Join("/tmp", id)
		file, err := os.Open(filePath)
		if err != nil {
			if os.IsNotExist(err) {
				return echo.NewHTTPError(http.StatusNotFound, "ファイルが見つかりません")
			}
			return echo.NewHTTPError(http.StatusInternalServerError, "ファイルを開く際にエラー: "+err.Error())
		}
		defer file.Close()

		reader := bufio.NewReader(file)
		req, err := http.ReadRequest(reader)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "リクエストの読み込みに失敗しました: "+err.Error())
		}

		ext, err := mime.ExtensionsByType(req.Header.Get("Content-Type"))
		if err == nil && len(ext) > 0 {
			c.Response().Header().Set("Content-Disposition", "attachment; filename="+id+ext[0])
		}

		return c.Stream(http.StatusOK, req.Header.Get("Content-Type"), req.Body)

	})

	staticDir := "./web/dist"
	e.Static("/", staticDir)


	e.Logger.Fatal(e.Start(":8080"))
}
