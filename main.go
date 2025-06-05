package main

import (
	"bufio"
	"fmt"
	"mime"
	"net/http"
	"net/http/httputil"
	"os"
	"path/filepath"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/rs/xid"
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
		rawid := c.Param("id")
		split := strings.Split(rawid, ".")
		id := split[0]
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

		filename := ""
		_, params, err := mime.ParseMediaType(req.Header.Get("Content-Disposition"))
		if err == nil {
			fmt.Println(params)
			if fn, ok := params["filename"]; ok {
				filename = fn
			}
		} else {
			fmt.Println("content-disposition:", req.Header.Get("Content-Disposition"))
			fmt.Println("Content-Dispositionヘッダーの解析に失敗:", err)
		}

		if filename == "" {
			ext := ".data"
			exts, err := mime.ExtensionsByType(req.Header.Get("Content-Type"))
			if err == nil && len(exts) > 0 {
				ext = exts[0]
			}

			filename = id + ext
		}

		c.Response().Header().Set("Content-Disposition", "attachment; filename="+filename)
		return c.Stream(http.StatusOK, req.Header.Get("Content-Type"), req.Body)
	})

	staticDir := "./web/dist"
	e.Static("/", staticDir)

	e.Logger.Fatal(e.Start(":8080"))
}
